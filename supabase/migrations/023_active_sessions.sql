-- Create PostgreSQL functions to fetch and manage user sessions securely

CREATE OR REPLACE FUNCTION get_user_sessions()
RETURNS TABLE (
    id uuid,
    user_agent text,
    ip inet,
    created_at timestamptz,
    updated_at timestamptz,
    is_current boolean
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.user_agent,
        s.ip,
        s.created_at,
        s.updated_at,
        s.id = COALESCE((auth.jwt()->>'sid')::uuid, '00000000-0000-0000-0000-000000000000'::uuid) AS is_current
    FROM auth.sessions s
    WHERE s.user_id = auth.uid()
    ORDER BY s.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION revoke_user_session(target_session_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM auth.sessions
    WHERE id = target_session_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION revoke_other_user_sessions()
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_sid uuid;
    authenticated_user_id uuid;
BEGIN
    current_sid := COALESCE((auth.jwt()->>'sid')::uuid, '00000000-0000-0000-0000-000000000000'::uuid);
    authenticated_user_id := auth.uid();
    
    DELETE FROM auth.sessions
    WHERE user_id = authenticated_user_id AND id <> current_sid;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to the authenticated role
GRANT EXECUTE ON FUNCTION get_user_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_user_session(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_other_user_sessions() TO authenticated;
