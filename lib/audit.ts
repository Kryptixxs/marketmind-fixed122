export async function logAction(userId: string, action: string, metadata: any = {}) {
  console.log(`[AUDIT LOG] User: ${userId}, Action: ${action}, Metadata:`, metadata);
  
  // This would typically write to Supabase 'audit_logs' table
  /*
  const { error } = await supabase
    .from('audit_logs')
    .insert([{ user_id: userId, action, metadata, timestamp: new Date().toISOString() }]);
  */
}