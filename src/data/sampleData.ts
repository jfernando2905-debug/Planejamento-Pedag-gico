import { WeeklyPlanning, SavedLesson, Story, Song, Game } from '../types';

export const SAMPLE_PLANNING: WeeklyPlanning = {
  id: 'planning-sample-1',
  userId: 'default-user',
  schoolName: 'Escola de Educação Infantil Cristão de Curitiba',
  className: 'KINDER 3',
  year: '2026',
  teacher: 'Profe Camila',
  period: 'Vespertino',
  week: 'Semana 26',
  startDate: '2026-07-27',
  endDate: '2026-07-31',
  generalTheme: 'Lembranças das Férias, Numeral 6 e Meios de Transporte',
  project: 'Projeto Identidade e Descobrimentos',
  bookWorked: 'A menina e o Barquinho',
  generalNotes: 'Planejamento enviado à diretora Camila.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  days: {
    segunda: {
      dayName: 'Segunda-feira',
      dateStr: '27/07',
      subHeader: 'PEDAGÓGICA',
      routine: [
        {
          id: 'r-seg-1',
          time: '13:00 – 13:20',
          title: 'ROTINA / ACOLHIDA',
          description: '- Higienização: Banheiro e encher as garrafas com água.\n- Rotina: Chamada, calendário, tempo, quantos somos.\n- Devocional.',
          order: 1
        },
        {
          id: 'r-seg-2',
          time: '13:20 – 14:10',
          title: 'CONTAÇÃO DE HISTÓRIA',
          description: 'Momento de acolhimento e contação de história em roda.',
          order: 2
        },
        {
          id: 'r-seg-3',
          time: '14:10 – 14:40',
          title: 'LANCHE',
          description: 'Momento da refeição e higienização das mãos.',
          order: 3
        },
        {
          id: 'r-seg-4',
          time: '14:40 – 15:30',
          title: 'BILÍNGUE',
          description: 'Aplicações lúdicas em segunda língua.',
          order: 4
        },
        {
          id: 'r-seg-5',
          time: '15:30 – 16:20',
          title: 'ARTES',
          description: 'Atividades manuais e expressão plástica.',
          order: 5
        },
        {
          id: 'r-seg-6',
          time: '16:20 – 16:40',
          title: 'FRUTA / HIGIENE',
          description: 'Intervalo de fruta e banheiro.',
          order: 6
        },
        {
          id: 'r-seg-7',
          time: '16:40 – 17:15',
          title: 'ATIVIDADE RECREATIVA',
          description: 'Brincadeira livre no parquinho.',
          order: 7
        },
        {
          id: 'r-seg-8',
          time: '17:15',
          title: 'SAÍDA',
          description: 'Organização das mochilas e recepção dos pais.',
          order: 8
        }
      ],
      lessons: []
    },
    terca: {
      dayName: 'Terça-feira',
      dateStr: '28/07',
      routine: [
        {
          id: 'r-ter-1',
          time: '13:00 – 13:20',
          title: 'ROTINA / ACOLHIDA',
          description: '- Higienização: Banheiro e encher as garrafas com água.\n- Rotina: Chamada, calendário, tempo, quantos somos.\n- Devocional.',
          order: 1
        },
        {
          id: 'r-ter-2',
          time: '13:20 – 14:10',
          title: 'AULA BÍBLICA',
          description: 'Planejamento enviado à diretora Camila.',
          order: 2
        },
        {
          id: 'r-ter-3',
          time: '14:10 – 14:40',
          title: 'LANCHE',
          description: 'Momento de alimentação.',
          order: 3
        },
        {
          id: 'r-ter-4',
          time: '14:40 – 15:30',
          title: 'BILÍNGUE',
          description: 'Atividade na língua adicional.',
          order: 4
        }
      ],
      lessons: [
        {
          id: 'l-ter-1',
          subject: 'LINGUAGEM',
          time: '15:30 – 16:20',
          theme: 'Minhas lembranças das férias',
          objectives: '- Desenvolver a oralidade ao compartilhar experiências.\n- Exercitar a escuta respeitosa.\n- Valorizar as vivências de cada criança.\n- Expressar sentimentos e emoções.\n- Fortalecer a identidade e o pertencimento ao grupo.',
          bnccCodes: ['EI03EF01', 'EI03EO04'],
          development: 'Para começar irei perguntar aos alunos: Quem viajou? Quem ficou em casa? Quem brincou bastante? Quem foi na casa da vovó? Quem comeu alguma comida gostosa?\n\nEm seguida faremos uma roda de conversa em que cada aluno irá mostrar sua caixinha das férias, tirando os objetos que trouxeram e mostrando aos colegas.',
          materials: ['Caixinha de lembranças das férias', 'Objetos pessoais dos alunos'],
          notes: 'Observar a participação e expressão oral de cada criança.',
          estimatedTime: '50 min'
        }
      ]
    },
    quarta: {
      dayName: 'Quarta-feira',
      dateStr: '29/07',
      routine: [
        {
          id: 'r-qua-1',
          time: '13:00 – 13:20',
          title: 'ROTINA / ACOLHIMENTO',
          description: '- Higienização: Banheiro e encher as garrafas com água.\n- Rotina: Chamada, calendário, tempo, quantos somos.\n- Devocional.',
          order: 1
        },
        {
          id: 'r-qua-2',
          time: '13:20 – 14:10',
          title: 'AULA BÍBLICA',
          description: 'Planejamento enviado à diretora Camila.',
          order: 2
        },
        {
          id: 'r-qua-3',
          time: '14:10 – 14:40',
          title: 'LANCHE',
          description: 'Intervalo.',
          order: 3
        },
        {
          id: 'r-qua-4',
          time: '14:40 – 15:30',
          title: 'BILÍNGUE',
          description: 'Atividades em inglês.',
          order: 4
        }
      ],
      lessons: [
        {
          id: 'l-qua-1',
          subject: 'MUSICALIZAÇÃO',
          time: '15:30 – 16:00',
          theme: 'Expressão Corporal e Ritmo',
          objectives: '- Experimentar possibilidades corporais e ritmos musicais.',
          bnccCodes: ['EI03TS01', 'EI03CG03'],
          development: 'Aula baseada em vídeo interativo e cantigas sobre navegação e ritmo corporal.',
          materials: ['Caixa de som', 'Instrumentos de percussão'],
          attachments: ['https://www.instagram.com/reel/Dare1GKIU1w/']
        }
      ]
    },
    quinta: {
      dayName: 'Quinta-feira',
      dateStr: '30/07',
      routine: [
        {
          id: 'r-qui-1',
          time: '13:00 – 13:20',
          title: 'ROTINA / ACOLHIDA',
          description: '- Higienização: Banheiro e encher as garrafas com água.\n- Rotina: Chamada, calendário, tempo, quantos somos.\n- Devocional.',
          order: 1
        }
      ],
      lessons: [
        {
          id: 'l-qui-1',
          subject: 'MATEMÁTICA',
          time: '13:20 – 14:10',
          theme: 'Numeral 6',
          objectives: 'Explorar contagem e relação numeral-quantidade.',
          bnccCodes: ['EI03ET07', 'EI03ET08', 'EI03CG02'],
          development: 'Iniciarei a aula apresentando aos alunos o numeral 6 em um tamanho grande, confeccionado em cartolina ou EVA. Em seguida, farei questionamentos: "Vocês conhecem esse número?", "Alguém sabe como ele se chama?".\n\nNa sequência, convidarei cada criança a realizar o contorno do número 6 com o dedo indicador. Apresentarei bolinhas e faremos a contagem coletiva: "Uma... duas... três... quatro... cinco... seis!".\n\nAtividade na apostila Página 43.',
          materials: ['Numeral 6 gigante em EVA', 'Bolinhas coloridas', 'Apostila página 43']
        },
        {
          id: 'l-qui-2',
          subject: 'NATUREZA E SOCIEDADE',
          time: '15:40 – 16:20',
          theme: 'MEIOS DE TRANSPORTE',
          objectives: '- Identificar diferentes meios de transporte.\n- Reconhecer onde circulam (terra, água ou ar).\n- Ampliar o vocabulário e estimular o faz de conta.',
          bnccCodes: ['EI03ET01', 'EI03EO03'],
          development: 'Levarei uma mochila com meios de transporte de brinquedo dentro. "Hoje vamos fazer uma grande viagem! Quem já viajou de carro, ônibus, avião ou bicicleta?". Explicarei os 3 tipos: Terrestres, Aéreos e Aquáticos.',
          materials: ['Mochila surpresa', 'Brinquedos de transporte (carro, avião, barco)']
        }
      ]
    },
    sexta: {
      dayName: 'Sexta-feira',
      dateStr: '31/07',
      routine: [
        {
          id: 'r-sex-1',
          time: '13:00 – 13:20',
          title: 'ROTINA / ACOLHIDA',
          description: '- Higienização: Banheiro e encher as garrafas com água.\n- Rotina: Chamada, calendário, tempo, quantos somos.\n- Devocional.',
          order: 1
        }
      ],
      lessons: [
        {
          id: 'l-sex-1',
          subject: 'CONTAÇÃO DE HISTÓRIA',
          time: '13:20 – 14:10',
          theme: 'A menina e o Barquinho',
          objectives: 'Trabalhar escuta atenta, imaginação e sentimentos.',
          bnccCodes: ['EI03EF04', 'EI03TS02'],
          development: 'Leitura interativa da história utilizando dobradura de papel que se transforma em barquinho ao longo da narrativa.',
          materials: ['Livro "A menina e o Barquinho"', 'Folhas de papel para dobradura']
        },
        {
          id: 'l-sex-2',
          subject: 'ATIVIDADE RECREATIVA',
          time: '16:40 – 17:15',
          theme: 'Separando os Transportes (Atividade Lúdica)',
          objectives: 'Classificar transportes de forma lúdica em equipe.',
          bnccCodes: ['EI03ET01', 'EI03CG02'],
          development: 'Colocarei no chão três cartazes grandes: Terrestres, Aéreos e Aquáticos. Entregarei uma figura para cada criança. Cada uma irá observar a imagem, dizer o nome e colocar no cartaz correspondente.',
          materials: ['3 Cartazes grandes', 'Fichas ilustradas de meios de transporte']
        }
      ]
    }
  }
};

export const SAMPLE_LESSONS: SavedLesson[] = [
  {
    id: 'lesson-1',
    userId: 'default-user',
    name: 'Explorando o Numeral 6 com Circuito Motor',
    subject: 'MATEMÁTICA',
    theme: 'Numeral 6 e Contagem',
    objectives: '- Relacionar números às suas respectivas quantidades.\n- Explorar coordenação motora ampla através de estações.',
    bnccCodes: ['EI03ET07', 'EI03CG02'],
    development: 'Apresentar o numeral 6 em EVA gigante. Realizar contagem coletiva com blocos. Em seguida, aplicar circuito motor com 6 estações (Dar 6 pulos, passar por 6 cones, acertar 6 bolinhas no cesto, empilhar 6 blocos).',
    materials: ['Numeral 6 de EVA', 'Cones', 'Cestos', 'Bolinhas', 'Blocos de montar'],
    games: 'Circuito do Número 6',
    notes: 'Ótima aula para integrar matemática com educação física.',
    isFavorite: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'lesson-2',
    userId: 'default-user',
    name: 'Classificação de Meios de Transporte',
    subject: 'NATUREZA E SOCIEDADE',
    theme: 'Meios de Transporte Terrestre, Aéreo e Aquático',
    objectives: '- Diferenciar meios de transporte por seu meio de circulação.\n- Desenvolver linguagem e raciocínio lógico.',
    bnccCodes: ['EI03ET01', 'EI03EF01'],
    development: 'Roda de conversa com mochila surpresa contendo miniaturas. Apresentação das categorias. Dinâmica com 3 cartazes no chão para colagem e classificação coletiva.',
    materials: ['Miniaturas de transportes', 'Cartazes indicativos (Terra, Ar, Água)', 'Figuras para colar'],
    notes: 'Pode ser estendido para confecção de dobradura de barquinho de papel.',
    isFavorite: true,
    createdAt: new Date().toISOString()
  }
];

export const SAMPLE_STORIES: Story[] = [
  {
    id: 'story-1',
    userId: 'default-user',
    title: 'A Menina e o Barquinho',
    author: 'Adaptação Folclórica',
    description: 'A história de uma menina que ganha uma folha de papel e sonha em transformá-la em um barquinho para navegar pelo mar.',
    objectives: 'Estimular a imaginação, a escuta atenta, o acompanhamento de dobraduras e a linguagem oral.',
    ageRange: '3 a 5 anos',
    imageUrl: 'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?w=500&auto=format&fit=crop',
    isFavorite: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'story-2',
    userId: 'default-user',
    title: 'O Monstro das Cores',
    author: 'Anna Llenas',
    description: 'Um monstrinho confuso que precisa organizar suas emoções em potinhos coloridos para entender o que está sentindo.',
    objectives: 'Reconhecimento de emoções (alegria, tristeza, raiva, medo, calma), empatia e expressão verbal.',
    ageRange: '2 a 5 anos',
    imageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500&auto=format&fit=crop',
    isFavorite: true,
    createdAt: new Date().toISOString()
  }
];

export const SAMPLE_SONGS: Song[] = [
  {
    id: 'song-1',
    userId: 'default-user',
    name: 'O Barco Balança',
    author: 'Palavra Cantada',
    youtubeUrl: 'https://www.youtube.com/watch?v=sample1',
    objective: 'Desenvolver senso de ritmo, equilíbrio e percepção sonora.',
    notes: 'Usar com tecidos azuis simulação de ondas.',
    isFavorite: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'song-2',
    userId: 'default-user',
    name: 'A Canoa Virou',
    author: 'Domínio Público',
    youtubeUrl: 'https://www.youtube.com/watch?v=sample2',
    objective: 'Trabalhar o nome das crianças da turma e noção de espaço.',
    notes: 'Excelente para momento da chamada.',
    isFavorite: false,
    createdAt: new Date().toISOString()
  }
];

export const SAMPLE_GAMES: Game[] = [
  {
    id: 'game-1',
    userId: 'default-user',
    name: 'Circuito Número 6',
    category: 'Circuito Motor e Numeração',
    materials: '6 Cones, 6 Bolinhas, Cesto, 6 Blocos, 6 Tampinhas',
    description: 'Estação 1: Dar 6 pulos. Estação 2: Passar por 6 cones. Estação 3: Acertar 6 bolinhas no cesto. Estação 4: Empilhar 6 blocos. Estação 5: Colocar 6 tampinhas na caixa. Estação 6: 6 passos gigantes.',
    objectives: 'Aprimorar a coordenação motora ampla e associar a contagem do número 6 ao movimento físico.',
    ageRange: '4 a 5 anos',
    isFavorite: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'game-2',
    userId: 'default-user',
    name: 'Caixinha das Férias',
    category: 'Simbólica / Roda de Conversa',
    materials: 'Caixa de papelão decorada e objetos trazidos pelos alunos',
    description: 'Cada criança traz um objeto marcante das férias dentro da caixa para apresentar em roda para os colegas.',
    objectives: 'Promover a oralidade, partilha, escuta atenta e respeito ao colega.',
    ageRange: '3 a 5 anos',
    isFavorite: true,
    createdAt: new Date().toISOString()
  }
];
