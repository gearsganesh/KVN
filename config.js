// KVN Weddings & Conventions - Supabase configuration
// Browser-safe Supabase publishable key.
// NEVER replace this with a service_role/secret key.
window.KVN_SUPABASE_URL = "https://xtdvdxpabxjryaqkcrcc.supabase.co";
window.KVN_SUPABASE_ANON_KEY = "sb_publishable_2t_AblKyPQ3fFsCxMARMiQ_56-IHCAh";

// Booking workflow compatibility layer.
// The manager page historically updated enquiries directly, which changed the
// enquiry status but did not create/release the corresponding calendar booking.
// Route those status changes through the transactional Supabase RPC instead.
(() => {
  const originalCreateClient = window.supabase?.createClient;
  if (!originalCreateClient) return;

  window.supabase.createClient = (...args) => {
    const client = originalCreateClient(...args);
    const originalFrom = client.from.bind(client);

    client.from = (table) => {
      const builder = originalFrom(table);
      if (table !== "enquiries") return builder;

      const originalUpdate = builder.update.bind(builder);
      builder.update = (values) => {
        if (!values || typeof values.status !== "string") {
          return originalUpdate(values);
        }

        const updateBuilder = originalUpdate(values);
        const originalEq = updateBuilder.eq.bind(updateBuilder);
        updateBuilder.eq = (column, value) => {
          if (column === "id") {
            return client.rpc("update_enquiry_status", {
              p_enquiry_id: value,
              p_status: values.status
            });
          }
          return originalEq(column, value);
        };
        return updateBuilder;
      };

      return builder;
    };

    return client;
  };
})();
