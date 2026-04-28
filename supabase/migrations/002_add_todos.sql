-- Create a simple todos table
CREATE TABLE IF NOT EXISTS public.todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for the sake of this demo (you should restrict this in production)
CREATE POLICY "Allow public access to todos" ON public.todos
    FOR ALL
    USING (true)
    WITH CHECK (true);
