'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [editing, setEditing] = useState<any>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.from('blog_posts').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setPosts(data || []))
  }, [])

  async function save() {
    if (!editing) return
    const isNew = !editing.id
    const { error } = isNew
      ? await supabase.from('blog_posts').insert({ ...editing, slug: editing.title.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'') })
      : await supabase.from('blog_posts').update({ ...editing, updated_at: new Date().toISOString() }).eq('id', editing.id)
    if (error) { setMsg('Erro: ' + error.message); return }
    setMsg('Salvo com sucesso!')
    setEditing(null)
    const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false })
    setPosts(data || [])
    setTimeout(() => setMsg(''), 3000)
  }

  async function togglePublish(post: any) {
    await supabase.from('blog_posts').update({ published: !post.published }).eq('id', post.id)
    setPosts(posts.map(p => p.id === post.id ? { ...p, published: !p.published } : p))
  }

  async function deletePost(id: string) {
    if (!confirm('Deletar este post?')) return
    await supabase.from('blog_posts').delete().eq('id', id)
    setPosts(posts.filter(p => p.id !== id))
  }

  const style = {
    page: { padding: '32px', background: '#0A1628', minHeight: '100vh', color: '#EFF6FF', fontFamily: 'Inter,sans-serif' },
    h1: { fontSize: 28, fontWeight: 900, marginBottom: 8 },
    btn: { background: '#03624C', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700 },
    btnLime: { background: '#AADD00', color: '#0A1628', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700 },
    btnRed: { background: 'rgba(239,68,68,.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,.3)', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
    card: { background: '#111827', border: '1px solid #243244', borderRadius: 12, padding: 20, marginBottom: 12 },
    input: { width: '100%', background: '#111827', border: '1px solid #243244', borderRadius: 8, padding: '10px 14px', color: '#EFF6FF', fontSize: 14, fontFamily: 'Inter,sans-serif', marginBottom: 12, boxSizing: 'border-box' as const },
    textarea: { width: '100%', background: '#111827', border: '1px solid #243244', borderRadius: 8, padding: '10px 14px', color: '#EFF6FF', fontSize: 14, fontFamily: 'Inter,sans-serif', marginBottom: 12, minHeight: 120, boxSizing: 'border-box' as const, resize: 'vertical' as const },
    label: { fontSize: 12, color: '#64748B', fontWeight: 600, display: 'block', marginBottom: 5 },
    tag: (published: boolean) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: published ? 'rgba(170,221,0,.15)' : 'rgba(100,116,139,.15)', color: published ? '#AADD00' : '#64748B', border: `1px solid ${published ? 'rgba(170,221,0,.25)' : 'rgba(100,116,139,.25)'}` }),
  }

  return (
    <div style={style.page}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={style.h1}>Gerenciar Blog</h1>
          <p style={{ color: '#64748B', fontSize: 14 }}>{posts.length} artigo(s) cadastrado(s)</p>
        </div>
        <button style={style.btnLime} onClick={() => setEditing({ title: '', description: '', content: '', tag: '', cover_url: '', published: false, read_time: '5 min' })}>
          + Novo artigo
        </button>
      </div>

      {msg && <div style={{ background: 'rgba(170,221,0,.1)', border: '1px solid rgba(170,221,0,.25)', color: '#AADD00', padding: '10px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14 }}>{msg}</div>}

      {/* FORMULÁRIO DE EDIÇÃO */}
      {editing && (
        <div style={{ ...style.card, border: '1.5px solid #03624C', marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>{editing.id ? 'Editar artigo' : 'Novo artigo'}</h2>
          <label style={style.label}>Título</label>
          <input style={style.input} value={editing.title} onChange={e => setEditing({...editing, title: e.target.value})} placeholder="Título do artigo" />
          <label style={style.label}>Descrição (resumo)</label>
          <input style={style.input} value={editing.description} onChange={e => setEditing({...editing, description: e.target.value})} placeholder="Resumo para listagem" />
          <label style={style.label}>Conteúdo completo</label>
          <textarea style={style.textarea} value={editing.content} onChange={e => setEditing({...editing, content: e.target.value})} placeholder="Conteúdo do artigo..." />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={style.label}>Tag / Categoria</label>
              <input style={style.input} value={editing.tag} onChange={e => setEditing({...editing, tag: e.target.value})} placeholder="Ex: Discovery, CRM..." />
            </div>
            <div>
              <label style={style.label}>Tempo de leitura</label>
              <input style={style.input} value={editing.read_time} onChange={e => setEditing({...editing, read_time: e.target.value})} placeholder="Ex: 5 min" />
            </div>
          </div>
          <label style={style.label}>URL da imagem de capa</label>
          <input style={style.input} value={editing.cover_url} onChange={e => setEditing({...editing, cover_url: e.target.value})} placeholder="https://..." />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <input type="checkbox" id="pub" checked={editing.published} onChange={e => setEditing({...editing, published: e.target.checked})} />
            <label htmlFor="pub" style={{ fontSize: 14, cursor: 'pointer' }}>Publicar (visível no site)</label>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={style.btnLime} onClick={save}>Salvar artigo</button>
            <button style={{ ...style.btn, background: 'transparent', border: '1px solid #243244', color: '#64748B' }} onClick={() => setEditing(null)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* LISTA DE POSTS */}
      {posts.map(post => (
        <div key={post.id} style={style.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={style.tag(post.published)}>{post.published ? '● Publicado' : '○ Rascunho'}</span>
                {post.tag && <span style={{ fontSize: 11, color: '#64748B' }}>{post.tag}</span>}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{post.title}</div>
              <div style={{ fontSize: 13, color: '#64748B' }}>{post.description?.substring(0, 100)}...</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button style={style.btn} onClick={() => setEditing(post)}>Editar</button>
              <button style={{ ...style.btn, background: post.published ? 'rgba(245,158,11,.15)' : 'rgba(34,197,94,.15)', color: post.published ? '#F59E0B' : '#22C55E', border: `1px solid ${post.published ? 'rgba(245,158,11,.3)' : 'rgba(34,197,94,.3)'}` }} onClick={() => togglePublish(post)}>
                {post.published ? 'Despublicar' : 'Publicar'}
              </button>
              <button style={style.btnRed} onClick={() => deletePost(post.id)}>Deletar</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
