import { useRouter } from 'next/router';
import Head from 'next/head';
import { useState } from 'react';

const ANIME_CATEGORIES = [
  {
    name: 'All Anime Figures',
    nameJp: 'アニメ フィギュア',
    query: 'アニメ フィギュア',
    emoji: '✨',
    color: 'from-purple-600 to-pink-600',
    glow: 'rgba(139,92,246,0.4)',
    featured: true,
    description: 'All anime figures in one place',
  },
  {
    name: 'Demon Slayer',
    nameJp: '鬼滅の刃',
    query: '鬼滅の刃 フィギュア',
    emoji: '🗡️',
    color: 'from-red-600 to-orange-500',
    glow: 'rgba(239,68,68,0.3)',
  },
  {
    name: 'One Piece',
    nameJp: 'ワンピース',
    query: 'ワンピース フィギュア',
    emoji: '🏴‍☠️',
    color: 'from-yellow-500 to-orange-500',
    glow: 'rgba(234,179,8,0.3)',
  },
  {
    name: 'Dragon Ball',
    nameJp: 'ドラゴンボール',
    query: 'ドラゴンボール フィギュア',
    emoji: '⚡',
    color: 'from-orange-500 to-yellow-400',
    glow: 'rgba(249,115,22,0.3)',
  },
  {
    name: 'Naruto',
    nameJp: 'ナルト',
    query: 'ナルト フィギュア',
    emoji: '🍥',
    color: 'from-orange-400 to-yellow-500',
    glow: 'rgba(251,146,60,0.3)',
  },
  {
    name: 'Attack on Titan',
    nameJp: '進撃の巨人',
    query: '進撃の巨人 フィギュア',
    emoji: '⚔️',
    color: 'from-gray-600 to-gray-800',
    glow: 'rgba(75,85,99,0.4)',
  },
  {
    name: 'My Hero Academia',
    nameJp: '僕のヒーローアカデミア',
    query: '僕のヒーローアカデミア フィギュア',
    emoji: '🦸',
    color: 'from-green-500 to-emerald-600',
    glow: 'rgba(34,197,94,0.3)',
  },
  {
    name: 'Jujutsu Kaisen',
    nameJp: '呪術廻戦',
    query: '呪術廻戦 フィギュア',
    emoji: '👁️',
    color: 'from-indigo-600 to-purple-700',
    glow: 'rgba(99,102,241,0.3)',
  },
  {
    name: 'Evangelion',
    nameJp: 'エヴァンゲリオン',
    query: 'エヴァンゲリオン フィギュア',
    emoji: '🤖',
    color: 'from-purple-700 to-violet-900',
    glow: 'rgba(126,34,206,0.3)',
  },
  {
    name: 'Sailor Moon',
    nameJp: 'セーラームーン',
    query: 'セーラームーン フィギュア',
    emoji: '🌙',
    color: 'from-pink-500 to-rose-500',
    glow: 'rgba(236,72,153,0.3)',
  },
  {
    name: 'Sword Art Online',
    nameJp: 'ソードアート・オンライン',
    query: 'ソードアートオンライン フィギュア',
    emoji: '🗡️',
    color: 'from-blue-600 to-cyan-500',
    glow: 'rgba(37,99,235,0.3)',
  },
  {
    name: 'Re:Zero',
    nameJp: 'リゼロ',
    query: 'リゼロ フィギュア',
    emoji: '🌸',
    color: 'from-sky-500 to-blue-600',
    glow: 'rgba(14,165,233,0.3)',
  },
  {
    name: 'Chainsaw Man',
    nameJp: 'チェンソーマン',
    query: 'チェンソーマン フィギュア',
    emoji: '🪚',
    color: 'from-red-700 to-rose-900',
    glow: 'rgba(185,28,28,0.3)',
  },
  {
    name: 'Bleach',
    nameJp: 'ブリーチ',
    query: 'ブリーチ フィギュア',
    emoji: '☠️',
    color: 'from-slate-600 to-zinc-800',
    glow: 'rgba(71,85,105,0.4)',
  },
  {
    name: 'Fairy Tail',
    nameJp: 'フェアリーテイル',
    query: 'フェアリーテイル フィギュア',
    emoji: '🧚',
    color: 'from-blue-500 to-indigo-600',
    glow: 'rgba(59,130,246,0.3)',
  },
  {
    name: 'Fate Series',
    nameJp: 'フェイト',
    query: 'フェイト フィギュア',
    emoji: '⚜️',
    color: 'from-amber-500 to-yellow-600',
    glow: 'rgba(245,158,11,0.3)',
  },
  {
    name: 'Hatsune Miku',
    nameJp: '初音ミク',
    query: '初音ミク フィギュア',
    emoji: '🎤',
    color: 'from-teal-400 to-cyan-600',
    glow: 'rgba(20,184,166,0.3)',
  },
  {
    name: 'Neon Genesis',
    nameJp: 'ガンダム',
    query: 'ガンダム フィギュア',
    emoji: '🤖',
    color: 'from-blue-700 to-red-600',
    glow: 'rgba(29,78,216,0.3)',
  },
  {
    name: 'Black Clover',
    nameJp: 'ブラッククローバー',
    query: 'ブラッククローバー フィギュア',
    emoji: '🍀',
    color: 'from-emerald-600 to-green-800',
    glow: 'rgba(5,150,105,0.3)',
  },
  {
    name: 'Tokyo Ghoul',
    nameJp: '東京喰種',
    query: '東京喰種 フィギュア',
    emoji: '🩸',
    color: 'from-red-800 to-gray-900',
    glow: 'rgba(153,27,27,0.4)',
  },
  {
    name: 'Spy x Family',
    nameJp: 'スパイファミリー',
    query: 'スパイファミリー フィギュア',
    emoji: '🕵️',
    color: 'from-rose-500 to-pink-700',
    glow: 'rgba(244,63,94,0.3)',
  },
];

export default function AnimePage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');

  const featured = ANIME_CATEGORIES[0];
  const rest = ANIME_CATEGORIES.slice(1);

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (!q) return;
    router.push(`/search?query=${encodeURIComponent(q)}&category=${encodeURIComponent(q)}&from=anime`);
  };

  return (
    <>
      <Head>
        <title>Anime Figures — Japrix</title>
        <meta name="description" content="Shop authentic Japanese anime figures — Nendoroids, Figma, S.H.Figuarts and more from Japan's top shops." />
      </Head>

      <div className="min-h-screen bg-[#0d0d14]">

        {/* Header */}
        <div className="relative overflow-hidden border-b border-white/5 py-16 sm:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(139,92,246,0.2),transparent_70%)]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-purple-400">Japan Direct</span>
            </div>
            <h1 className="text-5xl sm:text-7xl font-black text-white mb-4 leading-tight">
              Anime{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Figures
              </span>
            </h1>
            <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto mb-8">
              Authentic Japanese collectibles sourced directly from Japan's top hobby shops
            </p>
            {/* Custom search */}
            <form onSubmit={handleCustomSearch} className="relative max-w-lg mx-auto mb-8">
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search any anime or character... (e.g. Gojo, Luffy, 進撃)"
                className="w-full px-5 py-4 pr-14 rounded-2xl bg-white/8 border border-white/15 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500/60 focus:bg-white/10 transition-all"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 text-white hover:opacity-90 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>

            <div className="flex flex-wrap gap-2 justify-center">
              {['ねんどろいど', 'figma', 'S.H.Figuarts', 'POP UP PARADE', 'プライズ', '限定品'].map(tag => (
                <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-gray-300">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">

          {/* Yahoo tip */}
          <div className="flex items-start gap-3 mb-6 px-4 py-3 rounded-2xl border border-yellow-400/30 bg-yellow-400/10">
            <span className="text-yellow-400 text-xl flex-shrink-0">💡</span>
            <p className="text-yellow-200 text-sm leading-relaxed">
              For the best anime figure selection, we recommend switching to{' '}
              <span className="font-bold text-yellow-300">Yahoo Shopping</span> — it has a wider range of figures and better availability than Rakuten.
            </p>
          </div>

          {/* Featured — All Anime Figures */}
          <button
            onClick={() => router.push(`/search?query=${encodeURIComponent(featured.query)}&category=${encodeURIComponent('Anime Figures')}&from=anime`)}
            className="group w-full mb-6 relative overflow-hidden rounded-3xl p-8 sm:p-12 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.15))', border: '1px solid rgba(139,92,246,0.3)' }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(139,92,246,0.15),transparent_60%)]" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(ellipse_at_30%_50%,rgba(139,92,246,0.25),transparent_60%)]" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="text-6xl sm:text-7xl">✨</div>
              <div className="flex-1">
                <div className="text-xs font-bold tracking-widest uppercase text-purple-400 mb-2">Browse All</div>
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">{featured.name}</h2>
                <p className="text-gray-400 text-sm sm:text-base">{featured.description}</p>
              </div>
              <div className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm transition-all"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>
                Shop Now
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </button>

          {/* Grid — individual anime */}
          <h2 className="text-white font-bold text-lg mb-4 sm:mb-6">Browse by Series</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {rest.map((anime) => (
              <button
                key={anime.nameJp}
                onClick={() => router.push(`/search?query=${encodeURIComponent(anime.query)}&category=${encodeURIComponent(anime.name)}&from=anime`)}
                className="group relative overflow-hidden rounded-2xl p-5 text-left transition-all hover:scale-[1.03] active:scale-[0.97]"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                  style={{ background: `radial-gradient(ellipse at 50% 100%, ${anime.glow}, transparent 70%)` }}
                />

                {/* Top gradient line */}
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl opacity-60 group-hover:opacity-100 transition-opacity"
                  style={{ background: `linear-gradient(90deg, ${anime.color.replace('from-', '').replace('to-', '')})` }}
                />

                <div className="relative">
                  <div className="text-4xl mb-3">{anime.emoji}</div>
                  <div className="text-white font-bold text-sm leading-tight mb-1">{anime.name}</div>
                  <div className="text-gray-500 text-xs">{anime.nameJp}</div>
                  <div className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-gray-500 group-hover:text-gray-300 transition-colors">
                    Browse
                    <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
