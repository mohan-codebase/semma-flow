'use server'

import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function addTodo(formData: FormData): Promise<void> {
  const name = formData.get('name') as string
  if (!name) return

  const supabase = await createServerClient()

  const { error } = await supabase
    .from('todos')
    .insert([{ name }])

  if (error) {
    console.error('Error adding todo:', error)
    return
  }

  revalidatePath('/')
}

export async function toggleTodo(id: string, isCompleted: boolean): Promise<void> {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('todos')
    .update({ is_completed: !isCompleted })
    .eq('id', id)

  if (error) {
    console.error('Error toggling todo:', error)
    return
  }

  revalidatePath('/')
}

export async function deleteTodo(id: string): Promise<void> {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting todo:', error)
    return
  }

  revalidatePath('/')
}
