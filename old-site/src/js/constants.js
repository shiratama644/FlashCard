export const TAG_COLORS = [
  'bg-red-500 text-white border-red-400', 'bg-blue-500 text-white border-blue-400',
  'bg-green-500 text-white border-green-400', 'bg-yellow-500 text-white border-yellow-400',
  'bg-purple-500 text-white border-purple-400', 'bg-pink-500 text-white border-pink-400',
  'bg-cyan-500 text-white border-cyan-400', 'bg-orange-500 text-white border-orange-400',
  'bg-teal-500 text-white border-teal-400',
];

export const DEFAULT_CATEGORIES = [
  { id: 'cat_english', name: '英語', colorClass: 'bg-blue-500 text-white border-blue-400', expanded: false, newTagName: '' },
  { id: 'cat_japanese', name: '国語', colorClass: 'bg-red-500 text-white border-red-400', expanded: false, newTagName: '' }
];

export const DEFAULT_TAGS = [
  { id: 1, name: '名詞', categoryId: 'cat_english', colorClass: 'bg-blue-500 text-white border-blue-400' },
  { id: 2, name: '動詞', categoryId: 'cat_english', colorClass: 'bg-red-500 text-white border-red-400' },
  { id: 3, name: '形容詞', categoryId: 'cat_english', colorClass: 'bg-green-500 text-white border-green-400' },
  { id: 4, name: '書き下し', categoryId: 'cat_japanese', colorClass: 'bg-purple-500 text-white border-purple-400' },
  { id: 5, name: '現代語訳', categoryId: 'cat_japanese', colorClass: 'bg-pink-500 text-white border-pink-400' }
];

export const DEFAULT_PROJECTS = [
  {
    id: 1, title: '多義語・英単語', description: '品詞で意味が変わる単語', categoryId: 'cat_english',
    cards: [
      { front: 'light', backDetails: [{ tagId: 1, value: '光・ライト' }, { tagId: 3, value: '軽い・明るい' }, { tagId: 2, value: '火をつける・照らす' }], example: 'Could you turn on the light?', stats: { likes: 0, nopes: 0, status: 'new' } },
      { front: 'book', backDetails: [{ tagId: 1, value: '本・書物' }, { tagId: 2, value: '予約する' }], example: 'I need to book a flight to Tokyo.', stats: { likes: 0, nopes: 0, status: 'new' } }
    ]
  },
  {
    id: 2, title: '漢文（再読文字の基本）', description: '漢文における重要な再読文字の書き下し方と現代語訳のセットです。', categoryId: 'cat_japanese',
    cards: [
      { front: '未', backDetails: [{ tagId: 4, value: 'いまだ〜ず' }, { tagId: 5, value: 'まだ〜ない' }], example: '未有変也（いまだへんあらざるなり：まだ変化がないのである）', stats: { likes: 0, nopes: 0, status: 'new' } },
      { front: '将 / 且', backDetails: [{ tagId: 4, value: 'まさに〜（せんと）す' }, { tagId: 5, value: '今にも〜しようとする、〜するつもりだ' }], example: '将行（まさに行かんとす：今にも出発しようとする）', stats: { likes: 0, nopes: 0, status: 'new' } },
      { front: '応', backDetails: [{ tagId: 4, value: 'まさに〜べし' }, { tagId: 5, value: 'きっと〜だろう、当然〜すべきだ' }], example: '応知（まさに知るべし：きっと知っているだろう）', stats: { likes: 0, nopes: 0, status: 'new' } },
      { front: '須', backDetails: [{ tagId: 4, value: 'すべからく〜べし' }, { tagId: 5, value: 'ぜひ〜する必要がある、〜しなければならない' }], example: '須知（すべからく知るべし：ぜひ知る必要がある）', stats: { likes: 0, nopes: 0, status: 'new' } },
      { front: '猶 / 由', backDetails: [{ tagId: 4, value: 'なほ〜のごとし' }, { tagId: 5, value: 'ちょうど〜のようだ、あたかも〜と同じだ' }], example: '過猶不及（過ぎたるはなほ及ばざるがごとし：行き過ぎているのは、届かないのと同じだ）', stats: { likes: 0, nopes: 0, status: 'new' } },
      { front: '宜', backDetails: [{ tagId: 4, value: 'よろしく〜べし' }, { tagId: 5, value: '〜するのがよい、〜するのが適当だ' }], example: '宜従（よろしく従ふべし：従うのがよい）', stats: { likes: 0, nopes: 0, status: 'new' } },
      { front: '盍 / 蓋', backDetails: [{ tagId: 4, value: 'なんぞ〜ざる' }, { tagId: 5, value: 'どうして〜しないのか、（〜すればよいのに）' }], example: '盍各言爾志（なんぞおのおのなんぢの志を言はざる：どうしてそれぞれ自分の抱負を言わないのか、言えばよいのに）', stats: { likes: 0, nopes: 0, status: 'new' } },
      { front: '当', backDetails: [{ tagId: 4, value: 'まさに〜べし' }, { tagId: 5, value: '当然〜すべきだ、きっと〜だろう' }], example: '当知（まさに知るべし：当然知るべきだ）', stats: { likes: 0, nopes: 0, status: 'new' } }
    ]
  }
];