import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import Admin from './Admin'

const DEF_BANNER = {
  title: 'Perjalanan Nyaman, Tanpa Repot, Harga Ngesot',
  sub: 'Pesan mobil dengan sopir berpengalaman. Lanjut lewat WhatsApp.',
  img: '',
}

export default function App() {
  const [name, setName] = useState(() => localStorage.getItem('jackpot_name') || '')
  const [view, setView] = useState('home')
  const [sel, setSel] = useState(null)
  const [menu, setMenu] = useState(false)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [data, setData] = useState({ cars: [], arts: [], wa: '', banner: DEF_BANNER })

  const load = useCallback(async () => {
    const [c, a, s] = await Promise.all([
      supabase.from('cars').select('*').order('created_at'),
      supabase.from('articles').select('*').order('created_at', { ascending: false }),
      supabase.from('settings').select('*'),
    ])
    const e = c.error || a.error || s.error
    if (e) { setErr(e.message); setLoading(false); return }
    const st = Object.fromEntries(s.data.map((r) => [r.key, r.value]))
    setData({ cars: c.data, arts: a.data, wa: st.wa || '', banner: { ...DEF_BANNER, ...st.banner } })
    setErr('')
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const go = (v, s = null) => { setView(v); setSel(s); setMenu(false); window.scrollTo(0, 0) }
  const jump = (id) => {
    setMenu(false)
    if (view !== 'home' && id !== 'kontak') go('home')
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 60)
  }
  const top = () => (view !== 'home' ? go('home') : window.scrollTo({ top: 0, behavior: 'smooth' }))
  const logout = () => { localStorage.removeItem('jackpot_name'); setName(''); go('home') }
  const wa = data.wa.replace(/\D/g, '')
  const guest = !name && view !== 'admin'

  return (
    <>
      <header className="nav">
        <div className="nw">
          <a className="logo" href="#" onClick={(e) => { e.preventDefault(); top() }}>🎰 Jackpot</a>
          <button className="burger" aria-label="Buka menu" aria-expanded={menu} onClick={() => setMenu(!menu)}>☰ Menu</button>
          <nav id="nl" className={menu ? 'open' : ''} aria-label="Menu utama">
            <a href="#" onClick={(e) => { e.preventDefault(); top(); setMenu(false) }}>Beranda</a>
            {name && <a href="#" onClick={(e) => { e.preventDefault(); jump('cars') }}>Mobil</a>}
            {name && <a href="#" onClick={(e) => { e.preventDefault(); jump('arts') }}>Artikel</a>}
            <a href="#" onClick={(e) => { e.preventDefault(); jump('kontak') }}>Kontak</a>
            {name && <span className="hi">Halo, <b>{name}</b></span>}
            {name && <button onClick={logout}>Ganti Nama</button>}
          </nav>
        </div>
      </header>

      <main>
        {err && <div className="note err">Gagal memuat data: {err}</div>}
        {guest ? <Welcome onSave={(n) => { localStorage.setItem('jackpot_name', n); setName(n) }} />
          : view === 'admin' ? <Admin data={data} reload={load} go={go} />
          : loading ? <p>Memuat...</p>
          : view === 'book' ? <Book car={sel} name={name} wa={wa} go={go} />
          : view === 'article' ? <Article art={sel} go={go} />
          : <Home data={data} go={go} jump={jump} />}
      </main>

      <footer id="kontak">
        <div className="fw">
          <div>
            <h3>🎰 Jackpot</h3>
            <p>Layanan pesan mobil dengan sopir yang mudah, cepat, dan nyaman untuk Anda dan keluarga.</p>
          </div>
          {name && (
            <div>
              <h3>Menu</h3>
              <a href="#" onClick={(e) => { e.preventDefault(); top() }}>Beranda</a>
              <a href="#" onClick={(e) => { e.preventDefault(); jump('cars') }}>Pilih Mobil</a>
              <a href="#" onClick={(e) => { e.preventDefault(); jump('arts') }}>Artikel &amp; Tips</a>
            </div>
          )}
          <div>
            <h3>Hubungi Kami</h3>
            <p>Tanya dan pesan langsung lewat WhatsApp.</p>
            {wa && <a className="fwa" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">💬 Chat WhatsApp</a>}
            {wa && <p>+{wa}</p>}
          </div>
        </div>
        <div className="fb">
          © {new Date().getFullYear()} Jackpot. Semua hak dilindungi. ·{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); go('admin') }}>Admin</a>
        </div>
      </footer>
    </>
  )
}

function Welcome({ onSave }) {
  const [v, setV] = useState('')
  const [warn, setWarn] = useState(false)
  const submit = (e) => { e.preventDefault(); v.trim() ? onSave(v.trim()) : setWarn(true) }
  return (
    <form className="form" onSubmit={submit}>
      <h2>Selamat Datang di Jackpot</h2>
      <p>Pesan mobil dengan mudah. Silakan isi nama Anda untuk melanjutkan.</p>
      <label htmlFor="nm">Nama Anda</label>
      <input id="nm" autoComplete="name" placeholder="Contoh: Bapak Budi" value={v} onChange={(e) => setV(e.target.value)} />
      {warn && <p className="err">Mohon isi nama Anda.</p>}
      <div className="row"><button className="wide" type="submit">Lanjut ➜</button></div>
    </form>
  )
}

function Curved({ text }) {
  const layers = Array.from({ length: 20 }, (_, k) => k + 1).reverse()
  return (
    <svg className="curve" viewBox="0 0 500 112" role="img" aria-label={text}>
      <path id="title-arc" d="M24 74 Q240 6 456 74" fill="none" />
      {layers.map((i) => {
        const solid = i <= 6
        const o = solid ? 1 : Math.max(0.04, 0.5 * (1 - (i - 6) / 14))
        return (
          <text key={i} transform={`translate(${i} ${i})`} fontSize="40" fontWeight="800" fill={solid ? '#061a33' : '#03101f'} fillOpacity={o}>
            <textPath href="#title-arc" startOffset="50%" textAnchor="middle">{text}</textPath>
          </text>
        )
      })}
      <text fontSize="40" fontWeight="800" fill="#fff">
        <textPath href="#title-arc" startOffset="50%" textAnchor="middle">{text}</textPath>
      </text>
    </svg>
  )
}

function Home({ data, go, jump }) {
  const { banner: b, arts } = data
  const cars = data.cars.filter((c) => c.active)
  return (
    <>
      <section className="banner" style={b.img ? { backgroundImage: `linear-gradient(rgba(0,0,0,.5),rgba(0,0,0,.5)),url('${b.img}')` } : undefined}>
        <h2>{b.title.split(/(Harga Ngesot)/i).map((p, i) => (p.toLowerCase() === 'harga ngesot' ? <Curved key={i} text={p} /> : p))}</h2>
        <p>{b.sub}</p>
        <button onClick={() => jump('cars')}>Lihat Mobil ⬇</button>
      </section>

      <h2 id="cars">Pilih Mobil Anda</h2>
      {cars.length ? (
        <div className="grid">
          {cars.map((c) => (
            <div className="card" key={c.id}>
              {c.image_url ? <img className="ph" src={c.image_url} alt={c.name} /> : <div className="ph">🚗</div>}
              <div className="b">
                <h3>{c.name}</h3>
                <div><span className="tag">{c.type}</span><span className="tag">👥 {c.seats} orang</span></div>
                <div className="mut">{c.driver}</div>
                <div>{c.description}</div>
                <div style={{ flex: 1 }} />
                <button className="wide" onClick={() => go('book', c)}>Pesan Mobil Ini</button>
              </div>
            </div>
          ))}
        </div>
      ) : <div className="note">Maaf, belum ada mobil tersedia saat ini.</div>}

      {arts.length > 0 && (
        <>
          <h2 id="arts" style={{ marginTop: '2rem' }}>Artikel &amp; Tips Perjalanan</h2>
          <div className="grid">
            {arts.map((x) => (
              <div className="card" key={x.id}>
                {x.image_url ? <img className="ph" src={x.image_url} alt="" /> : <div className="ph">📰</div>}
                <div className="b">
                  <h3>{x.title}</h3>
                  <div className="mut">{new Date(x.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}</div>
                  <div>{x.body.slice(0, 110)}...</div>
                  <div style={{ flex: 1 }} />
                  <button className="sec wide" onClick={() => go('article', x)}>Baca Selengkapnya</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}

function Article({ art, go }) {
  return (
    <>
      <div className="art">
        {art.image_url && <img className="ph" src={art.image_url} alt="" />}
        <div className="tx">
          <h2>{art.title}</h2>
          <div className="mut">{new Date(art.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}</div>
          <p>{art.body}</p>
        </div>
      </div>
      <div className="row" style={{ maxWidth: 760, margin: '1rem auto' }}>
        <button className="sec" onClick={() => go('home')}>⬅ Kembali</button>
      </div>
    </>
  )
}

function Book({ car, name, wa, go }) {
  const today = new Date().toISOString().slice(0, 10)
  const [f, setF] = useState({ d: today, j: '08:00', p: '', t: '', n: 2, m: '' })
  const [warn, setWarn] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const send = () => {
    if (!f.d || !f.p.trim() || !f.t.trim()) return setWarn('Mohon isi tanggal, lokasi jemput, dan tujuan.')
    if (!wa) return setWarn('Nomor WhatsApp admin belum diatur.')
    const msg = `Halo Admin Jackpot, saya ingin memesan mobil:\n\nNama: ${name}\nMobil: ${car.name}\nTanggal: ${f.d}\nJam jemput: ${f.j}\nJemput di: ${f.p}\nTujuan: ${f.t}\nPenumpang: ${f.n} orang\nCatatan: ${f.m || '-'}\n\nTerima kasih.`
    window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="form">
      <h2>Pesan: {car.name}</h2>
      <div className="note">Pembayaran tidak dilakukan di sini. Pesanan Anda akan dikirim ke admin lewat WhatsApp.</div>
      <label htmlFor="d">Tanggal berangkat</label>
      <input id="d" type="date" min={today} value={f.d} onChange={set('d')} />
      <label htmlFor="j">Jam jemput</label>
      <input id="j" type="time" value={f.j} onChange={set('j')} />
      <label htmlFor="p">Lokasi jemput</label>
      <input id="p" placeholder="Alamat penjemputan" value={f.p} onChange={set('p')} />
      <label htmlFor="t">Tujuan</label>
      <input id="t" placeholder="Mau ke mana?" value={f.t} onChange={set('t')} />
      <label htmlFor="n">Jumlah penumpang</label>
      <input id="n" type="number" min="1" max={car.seats} value={f.n} onChange={set('n')} />
      <label htmlFor="m">Catatan (boleh kosong)</label>
      <textarea id="m" value={f.m} onChange={set('m')} />
      {warn && <p className="err">{warn}</p>}
      <div className="row">
        <button className="sec" onClick={() => go('home')}>⬅ Kembali</button>
        <button className="wa" onClick={send}>Kirim ke WhatsApp</button>
      </div>
    </div>
  )
}
