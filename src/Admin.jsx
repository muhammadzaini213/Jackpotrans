import { useEffect, useId, useState } from 'react'
import { supabase, uploadImage } from './supabase'

function Inp({ label, area, ...p }) {
  const id = useId()
  return (
    <>
      <label htmlFor={id}>{label}</label>
      {area ? <textarea id={id} {...p} /> : <input id={id} {...p} />}
    </>
  )
}

function Img({ url, onUrl }) {
  const id = useId()
  const [busy, setBusy] = useState(false)
  const pick = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setBusy(true)
    try { onUrl(await uploadImage(file)) } catch (er) { alert('Gagal mengunggah: ' + er.message) }
    setBusy(false)
  }
  return (
    <>
      <label htmlFor={id}>Gambar</label>
      <input id={id} type="file" accept="image/*" onChange={pick} />
      {busy && <p>Mengunggah...</p>}
      {url && <img className="ph preview" src={url} alt="" />}
    </>
  )
}

export default function Admin({ data, reload, go }) {
  const [session, setSession] = useState(undefined)
  const [ok, setOk] = useState(false)
  const [tab, setTab] = useState('cars')
  const [edit, setEdit] = useState(null) // { kind: 'car' | 'art', item }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: d }) => setSession(d.session))
    const { data: l } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => l.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) { setOk(false); return }
    supabase.from('admins').select('user_id').eq('user_id', session.user.id).maybeSingle()
      .then(({ data: d }) => { setOk(!!d); if (d) reload() })
  }, [session, reload])

  const run = async (p) => {
    const { error } = await p
    if (error) { alert(error.message); return false }
    await reload()
    return true
  }
  const logout = async () => { await supabase.auth.signOut(); await reload(); go('home') }

  if (session === undefined) return <p>Memuat...</p>
  if (!session) return <Login />
  if (!ok) {
    return (
      <div className="form">
        <h2>Akses ditolak</h2>
        <p>Akun ini belum terdaftar sebagai admin.</p>
        <div className="row"><button onClick={logout}>Keluar</button></div>
      </div>
    )
  }

  if (edit?.kind === 'car') return <CarForm item={edit.item} run={run} onDone={() => setEdit(null)} />
  if (edit?.kind === 'art') return <ArtForm item={edit.item} run={run} onDone={() => setEdit(null)} />

  const del = async (table, id, label) => {
    if (confirm(`Hapus ${label} ini?`)) await run(supabase.from(table).delete().eq('id', id))
  }

  return (
    <>
      <h2>Panel Admin</h2>
      <div className="tabs">
        <button className={tab === 'cars' ? 'on' : ''} onClick={() => setTab('cars')}>Mobil</button>
        <button className={tab === 'arts' ? 'on' : ''} onClick={() => setTab('arts')}>Artikel</button>
        <button className={tab === 'set' ? 'on' : ''} onClick={() => setTab('set')}>Banner &amp; WhatsApp</button>
      </div>

      {tab === 'cars' && (
        <>
          <div className="row" style={{ marginBottom: '1rem' }}>
            <button onClick={() => setEdit({ kind: 'car', item: {} })}>➕ Tambah Mobil</button>
          </div>
          <div className="grid">
            {data.cars.map((c) => (
              <div className={`card ${c.active ? '' : 'off'}`} key={c.id}>
                {c.image_url ? <img className="ph" src={c.image_url} alt="" /> : <div className="ph">🚗</div>}
                <div className="b">
                  <h3>{c.name}</h3>
                  <div className="mut">{c.active ? 'Tersedia' : 'Disembunyikan'}</div>
                  <div className="row">
                    <button onClick={() => setEdit({ kind: 'car', item: c })}>Ubah</button>
                    <button className="sec" onClick={() => del('cars', c.id, 'mobil')}>Hapus</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'arts' && (
        <>
          <div className="row" style={{ marginBottom: '1rem' }}>
            <button onClick={() => setEdit({ kind: 'art', item: {} })}>📰 Tambah Artikel</button>
          </div>
          <div className="grid">
            {data.arts.map((x) => (
              <div className="card" key={x.id}>
                <div className="b">
                  <h3>{x.title}</h3>
                  <div className="row">
                    <button onClick={() => setEdit({ kind: 'art', item: x })}>Ubah</button>
                    <button className="sec" onClick={() => del('articles', x.id, 'artikel')}>Hapus</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'set' && <SettingsForm data={data} run={run} />}

      <div className="row" style={{ marginTop: '2rem' }}>
        <button className="sec" onClick={() => go('home')}>🏠 Ke Beranda</button>
        <button className="sec" onClick={logout}>Keluar</button>
      </div>
    </>
  )
}

function Login() {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw })
    setBusy(false)
    if (error) setMsg('Email atau kata sandi salah.')
  }
  return (
    <form className="form" onSubmit={submit}>
      <h2>Masuk Admin</h2>
      <Inp label="Email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Inp label="Kata sandi" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} />
      {msg && <p className="err">{msg}</p>}
      <div className="row"><button type="submit" disabled={busy}>{busy ? 'Masuk...' : 'Masuk'}</button></div>
    </form>
  )
}

function CarForm({ item, run, onDone }) {
  const [f, setF] = useState({ name: '', type: '', seats: 4, driver: 'Termasuk sopir', description: '', image_url: '', active: true, ...item })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = async () => {
    if (!f.name.trim()) return alert('Nama mobil wajib diisi')
    setBusy(true)
    const row = { name: f.name.trim(), type: f.type, seats: Number(f.seats) || 1, driver: f.driver, description: f.description, image_url: f.image_url, active: f.active }
    const p = item.id ? supabase.from('cars').update(row).eq('id', item.id) : supabase.from('cars').insert(row)
    if (await run(p)) onDone()
    setBusy(false)
  }
  return (
    <div className="form">
      <h2>{item.id ? 'Ubah' : 'Tambah'} Mobil</h2>
      <Inp label="Nama mobil" value={f.name} onChange={set('name')} />
      <Inp label="Jenis (MPV, SUV, dll)" value={f.type} onChange={set('type')} />
      <Inp label="Jumlah kursi" type="number" min="1" value={f.seats} onChange={set('seats')} />
      <Inp label="Sopir / keterangan" value={f.driver} onChange={set('driver')} />
      <Inp label="Deskripsi" area value={f.description} onChange={set('description')} />
      <Img url={f.image_url} onUrl={(u) => setF({ ...f, image_url: u })} />
      <label style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
        <input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} />
        Tersedia untuk dipesan
      </label>
      <div className="row">
        <button className="sec" onClick={onDone}>Batal</button>
        <button onClick={save} disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan'}</button>
      </div>
    </div>
  )
}

function ArtForm({ item, run, onDone }) {
  const [f, setF] = useState({ title: '', body: '', image_url: '', ...item })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = async () => {
    if (!f.title.trim() || !f.body.trim()) return alert('Judul dan isi wajib diisi')
    setBusy(true)
    const row = { title: f.title.trim(), body: f.body.trim(), image_url: f.image_url }
    const p = item.id ? supabase.from('articles').update(row).eq('id', item.id) : supabase.from('articles').insert(row)
    if (await run(p)) onDone()
    setBusy(false)
  }
  return (
    <div className="form">
      <h2>{item.id ? 'Ubah' : 'Tambah'} Artikel</h2>
      <Inp label="Judul" value={f.title} onChange={set('title')} />
      <Inp label="Isi artikel" area style={{ minHeight: 220 }} value={f.body} onChange={set('body')} />
      <Img url={f.image_url} onUrl={(u) => setF({ ...f, image_url: u })} />
      <div className="row">
        <button className="sec" onClick={onDone}>Batal</button>
        <button onClick={save} disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan'}</button>
      </div>
    </div>
  )
}

function SettingsForm({ data, run }) {
  const [wa, setWa] = useState(data.wa)
  const [b, setB] = useState(data.banner)
  const [busy, setBusy] = useState(false)
  const save = async () => {
    setBusy(true)
    const ok = await run(supabase.from('settings').upsert([{ key: 'wa', value: wa.replace(/\D/g, '') }, { key: 'banner', value: b }]))
    setBusy(false)
    if (ok) alert('Tersimpan')
  }
  return (
    <div className="form">
      <h2>Banner &amp; WhatsApp</h2>
      <Inp label="Nomor WhatsApp admin (awali 62)" inputMode="numeric" value={wa} onChange={(e) => setWa(e.target.value)} />
      <Inp label="Judul banner" value={b.title} onChange={(e) => setB({ ...b, title: e.target.value })} />
      <Inp label="Kalimat pendukung" area value={b.sub} onChange={(e) => setB({ ...b, sub: e.target.value })} />
      <Img url={b.img} onUrl={(u) => setB({ ...b, img: u })} />
      <div className="row"><button onClick={save} disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan'}</button></div>
    </div>
  )
}
