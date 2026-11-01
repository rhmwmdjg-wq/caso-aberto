/* =========================================================
   CASO ABERTO — Arquivo de casos
   Cada caso tem: suspeitos, métodos, motivos, solução,
   locais (2 pistas cada), depoimentos (2 por suspeito),
   dossiês por especialidade, novidades por rodada e
   pistas falsas que o Cúmplice pode plantar.
   ========================================================= */
var CASOS = [
  /* ------------------------------------------------------ */
  {
    id: "brinde",
    titulo: "O Último Brinde",
    subtitulo: "Fazenda Boa Vista · noite de aniversário",
    dificuldade: "Fácil",
    capa: "🍷",
    intro: [
      "Dona Celeste Amaral, 72 anos, dona da Fazenda Boa Vista, comemorava o aniversário com a família e alguns convidados.",
      "Depois do jantar, ela se recolheu ao escritório com uma xícara de chá. Às 22h20, a neta Marina a encontrou caída sobre a mesa, sem vida.",
      "A delegacia mais próxima fica a duas horas de estrada. Até lá, cabe a vocês descobrir quem fez isso, como e por quê."
    ],
    vitima: "Dona Celeste Amaral, 72 anos",
    suspeitos: [
      { id: "s1", nome: "Otávio Amaral", idade: 45, ocupacao: "Filho de Dona Celeste", descricao: "Charmoso e endividado. Já perdeu muito dinheiro em apostas." },
      { id: "s2", nome: "Lúcia Prado", idade: 38, ocupacao: "Enfermeira particular", descricao: "Cuida dos remédios de Dona Celeste há três anos. Discreta e metódica." },
      { id: "s3", nome: "Dr. Rafael Duarte", idade: 51, ocupacao: "Advogado da família", descricao: "Administra as contas da fazenda há uma década. Sempre de terno." },
      { id: "s4", nome: "Marina Amaral", idade: 24, ocupacao: "Neta, estudante de artes", descricao: "Temperamental. Discutiu com a avó durante o jantar." },
      { id: "s5", nome: "Seu Joaquim", idade: 60, ocupacao: "Caseiro", descricao: "Trabalha na fazenda desde menino. Conhece cada canto da casa." }
    ],
    metodos: [
      { id: "m1", nome: "Veneno de rato no vinho do brinde" },
      { id: "m2", nome: "Superdose do remédio do coração no chá" },
      { id: "m3", nome: "Golpe com o castiçal de prata" },
      { id: "m4", nome: "Gás da lareira (monóxido de carbono)" }
    ],
    motivos: [
      { id: "o1", nome: "Herança da fazenda" },
      { id: "o2", nome: "Esconder um desvio de dinheiro" },
      { id: "o3", nome: "Vingança por uma briga antiga" },
      { id: "o4", nome: "Amor proibido / ciúmes" }
    ],
    solucao: {
      culpado: "s3", metodo: "m2", motivo: "o2",
      explicacao: "O Dr. Rafael desviava dinheiro da fazenda havia anos para uma empresa no nome da esposa. Dona Celeste desconfiou e marcou uma auditoria para segunda-feira. Usando a chave reserva do armário de remédios, que ficava na pasta de documentos que ele carregava, Rafael pegou comprimidos do remédio do coração, dissolveu no chá deixado no corredor às 21h45 e voltou à sala jurando que nunca tinha saído de lá. Depois queimou na lareira a carta que falava da auditoria."
    },
    locais: [
      { id: "l1", nome: "Escritório", icone: "🗄️", pistas: [
        "A xícara de chá sobre a mesa tem um resíduo amargo no fundo. A taça de vinho do brinde, ao lado, está limpa: ninguém colocou nada nela.",
        "Não há sinal de luta nem ferimento no corpo. O castiçal de prata está no lugar de sempre, coberto de poeira."
      ]},
      { id: "l2", nome: "Cozinha", icone: "🍳", pistas: [
        "A cozinheira preparou o chá às 21h40 e deixou a bandeja no corredor, esperando alguém levar. Por alguns minutos, qualquer um poderia mexer na xícara.",
        "O veneno de rato da despensa está com o lacre de fábrica intacto. Ninguém abriu."
      ]},
      { id: "l3", nome: "Armário de remédios", icone: "💊", pistas: [
        "A cartela do remédio do coração de Dona Celeste tem 8 comprimidos a menos do que o caderno de controle da enfermeira indica.",
        "O armário fica trancado. Existem duas chaves: uma com a enfermeira Lúcia e uma reserva, guardada na pasta de documentos da família, que fica com o advogado."
      ]},
      { id: "l4", nome: "Sala da lareira", icone: "🔥", pistas: [
        "Entre as cinzas da lareira, restos de papel queimado. Num pedaço ainda dá para ler: \"...auditoria marcada para segunda-feira...\"",
        "O registro da chaminé está aberto e a sala é bem ventilada. Não havia como acumular gás."
      ]},
      { id: "l5", nome: "Garagem", icone: "🚗", pistas: [
        "No banco do carro do Dr. Rafael, uma pasta com extratos: transferências mensais da conta da fazenda para uma empresa no nome da esposa dele.",
        "No tapete do mesmo carro, um pedacinho de papel-alumínio de cartela de comprimidos, igual ao do remédio do coração."
      ]}
    ],
    depoimentos: {
      s1: [
        "\"Saí pra fumar na varanda umas 21h30 e só voltei quando ouvi o grito da Marina.\"",
        "\"Devo dinheiro, sim. Mas a mãe prometeu no jantar que ia me ajudar a pagar. Eu não tinha por que fazer mal a ela.\""
      ],
      s2: [
        "\"Dei o remédio da noite às 20h, uma dose só, e anotei no caderno como sempre. Depois fui jantar com todo mundo.\"",
        "\"Minha chave não sai do meu pescoço. Mas sei que existe uma chave reserva. Nunca soube onde fica.\""
      ],
      s3: [
        "\"Passei a noite inteira na sala de jantar, conversando. Não saí de lá nem um minuto.\"",
        "\"A contabilidade da fazenda é impecável. Eu mesmo cuido de tudo, há dez anos.\""
      ],
      s4: [
        "\"Briguei com a vó porque ela não quis pagar meu intercâmbio. Fui grossa, eu sei. Mas eu amava ela.\"",
        "\"Lá pelas 21h45 vi o Dr. Rafael saindo apressado do corredor da cozinha, ajeitando o paletó.\""
      ],
      s5: [
        "\"Fiquei na varanda com o Seu Otávio, falando da colheita, até a hora do grito. Ele não saiu do meu lado.\"",
        "\"Ontem Dona Celeste me pediu pra tirar cópia de uns papéis do banco. Ela tava desconfiada de alguém, deu pra perceber.\""
      ]
    },
    dossies: {
      perito: "LAUDO PRELIMINAR: a morte foi causada por excesso de um medicamento para o coração, ingerido cerca de 30 minutos antes. Não há nenhum ferimento.",
      investigador: "CELULAR DA VÍTIMA: mensagem enviada às 19h para Otávio: \"Amanhã resolvemos sua dívida, fique tranquilo, filho.\"",
      escrivao: "REGISTRO DA NOITE: o chá foi levado ao escritório às 21h50. O corpo foi encontrado às 22h20 pela neta Marina.",
      arquivista: "CARTÓRIO: o testamento divide a fazenda igualmente entre Otávio e Marina. O Dr. Rafael é o administrador dos bens da família.",
      fotografo: "FOTOS DA FESTA: uma foto da sala de jantar às 21h45 mostra todos os convidados, menos Rafael, Otávio e Joaquim.",
      analista: "CONTAS DA FAZENDA: o lucro caiu pela metade nos últimos dois anos, mesmo com colheitas recordes."
    },
    novidades: {
      2: "O banco ligou: na sexta-feira, Dona Celeste pediu uma auditoria completa nas contas administradas pelo escritório de advocacia.",
      3: "Luvas de látex foram encontradas num vaso de plantas perto do corredor da cozinha. Tamanho grande, masculino."
    },
    falsas: [
      { texto: "Na bolsa da enfermeira Lúcia há uma cartela do remédio do coração pela metade, sem registro no caderno.", origem: "Armário de remédios" },
      { texto: "A cozinheira viu Marina mexendo na bandeja do chá por volta das 21h45.", origem: "Cozinha" },
      { texto: "Há uma marca roxa na nuca da vítima, como de uma pancada.", origem: "Escritório" },
      { texto: "No celular de Otávio, uma pesquisa recente: \"quanto tempo demora um inventário\".", origem: "Garagem" }
    ]
  },

  /* ------------------------------------------------------ */
  {
    id: "quermesse",
    titulo: "O Malote da Quermesse",
    subtitulo: "Associação de Moradores do Bairro Alto",
    dificuldade: "Médio",
    capa: "🎪",
    intro: [
      "A festa junina da Associação de Moradores do Bairro Alto foi um sucesso: R$ 18.240 arrecadados para reformar a quadra do bairro.",
      "O dinheiro foi contado às 23h, colocado num malote lacrado e guardado no cofre da sede. Na manhã seguinte, a tesoureira abriu o cofre para levar ao banco.",
      "O malote estava lá, com o lacre fechado. Dentro dele, só papel de jornal recortado. Alguém levou o dinheiro da comunidade."
    ],
    vitima: "Os R$ 18.240 da festa junina",
    suspeitos: [
      { id: "s1", nome: "Dona Zilda", idade: 58, ocupacao: "Tesoureira da associação", descricao: "Contou o dinheiro na festa. Única, além do presidente, que sabe a senha do cofre." },
      { id: "s2", nome: "Beto Fagundes", idade: 47, ocupacao: "Presidente da associação", descricao: "Simpático e popular. Ultimamente anda de carro novo." },
      { id: "s3", nome: "Kauã", idade: 19, ocupacao: "Técnico de som da festa", descricao: "Montou o palco e o som. Exibe um equipamento novinho." },
      { id: "s4", nome: "Neusa", idade: 40, ocupacao: "Dona da barraca de pastel", descricao: "Brigou com a associação no ano passado por causa do lugar da barraca." },
      { id: "s5", nome: "Silvano", idade: 55, ocupacao: "Vigia noturno", descricao: "Fica na portaria da sede. Anota tudo num livrinho." }
    ],
    metodos: [
      { id: "m1", nome: "Arrombou a janela dos fundos" },
      { id: "m2", nome: "Usou a chave reserva do cofre" },
      { id: "m3", nome: "Trocou o malote por um falso durante a contagem" },
      { id: "m4", nome: "Aproveitou a queda de energia para abrir o cofre" }
    ],
    motivos: [
      { id: "o1", nome: "Pagar uma dívida com agiota" },
      { id: "o2", nome: "Vingança contra a associação" },
      { id: "o3", nome: "Comprar equipamento novo" },
      { id: "o4", nome: "Estragar a festa da concorrência" }
    ],
    solucao: {
      culpado: "s2", metodo: "m3", motivo: "o1",
      explicacao: "Beto Fagundes devia R$ 17 mil a um agiota. Três dias antes da festa, comprou na papelaria um malote azul idêntico ao oficial e o encheu de jornal recortado. Na contagem, enquanto Dona Zilda foi buscar café, ele trocou os malotes, levou o falso para o cofre e saiu às 23h10 com o dinheiro na mochila. Mais tarde quebrou a janela por dentro para parecer arrombamento."
    },
    locais: [
      { id: "l1", nome: "Sala do cofre", icone: "🔐", pistas: [
        "O cofre não tem nenhuma marca de arrombamento. Foi aberto com a senha correta, e só uma vez desde a festa: pela tesoureira, de manhã.",
        "O vidro da janela dos fundos está quebrado, mas os cacos caíram do lado de fora. A janela foi quebrada de dentro para fora."
      ]},
      { id: "l2", nome: "Praça e barracas", icone: "🌽", pistas: [
        "Na lixeira da praça, um recibo da papelaria do bairro: 1 malote azul com lacre, comprado três dias antes da festa, pago com cartão de final 4471.",
        "O caderno da barraca de pastel mostra que Neusa teve o maior lucro de todas as barracas. Ela não tinha motivo para estragar a festa."
      ]},
      { id: "l3", nome: "Mesa de contagem", icone: "🧾", pistas: [
        "Ata da contagem: R$ 18.240 contados por Zilda e conferidos por Beto às 23h. Foi Beto quem fechou o malote e levou ao cofre, sozinho.",
        "Um vídeo de celular de um morador mostra que a luz da praça só caiu à 0h40, mais de uma hora e meia depois do malote ir para o cofre."
      ]},
      { id: "l4", nome: "Cabine de som", icone: "🎛️", pistas: [
        "O cabo do palco foi desligado na tomada, não foi pane. A queda de energia da 0h40 foi só o som sendo desmontado.",
        "Nota fiscal do equipamento de som novo do Kauã: comprado em 12 parcelas no nome da mãe dele, dois meses antes da festa."
      ]},
      { id: "l5", nome: "Portaria", icone: "🚪", pistas: [
        "No claviculário da portaria, a chave reserva do cofre está com o lacre plástico intacto. Ninguém mexeu nela.",
        "Livro do vigia: \"23h10 — Sr. Beto saiu com uma mochila preta nas costas. 23h25 — voltou sem a mochila.\""
      ]}
    ],
    depoimentos: {
      s1: [
        "\"Contei tudo com o Beto, nota por nota. Na hora de fechar o malote eu fui buscar um café. Quem fechou foi ele.\"",
        "\"Só eu e o Beto sabemos a senha do cofre. Eu abri de manhã e o malote estava lá, lacradinho.\""
      ],
      s2: [
        "\"Coloquei o malote no cofre na frente de todo mundo e fui direto pra casa dormir. Não saí mais.\"",
        "\"Minhas finanças? Vão muito bem, obrigado. O carro novo eu comprei com o meu suor.\""
      ],
      s3: [
        "\"Desliguei o som lá pela 0h40 pra enrolar os cabos. Foi aí que a praça ficou no escuro.\"",
        "\"Vi o seu Beto atravessando a praça com uma mochila preta, indo pro carro. Achei estranho, ele nunca anda de mochila.\""
      ],
      s4: [
        "\"Inveja da festa? Que nada, menino. Vendi como nunca. Quero é festa todo mês.\"",
        "\"Uns homens mal-encarados passaram na minha barraca perguntando pelo Beto. Disseram que ele 'tava devendo e sabia o quê'.\""
      ],
      s5: [
        "\"Ninguém entrou na sede depois da meia-noite. Fiquei na portaria o tempo todo, de olho.\"",
        "\"A janela dos fundos? Tava inteirinha quando fiz a ronda, à 1h da manhã.\""
      ]
    },
    dossies: {
      perito: "PERÍCIA: o lacre do malote encontrado no cofre tem numeração de outro lote, diferente da que está registrada na ata da associação.",
      investigador: "GRUPO DA ASSOCIAÇÃO: duas semanas antes da festa, Beto pediu um \"adiantamento\" da verba da festa. Zilda negou.",
      escrivao: "REGISTRO: a falta do dinheiro foi notada às 8h, quando Zilda abriu o cofre para depositar no banco.",
      arquivista: "CARTÓRIO: existe um protesto de dívida no nome de Alberto \"Beto\" Fagundes, no valor de R$ 17 mil.",
      fotografo: "FOTO DA CONTAGEM (23h): aparecem dois malotes azuis na mesa: um aberto e outro fechado, no chão, ao lado da cadeira do Beto.",
      analista: "CADASTRO DA PAPELARIA: o cartão de final 4471 está registrado como cliente \"Alberto F.\""
    },
    novidades: {
      2: "Um agiota conhecido na região foi visto, na manhã seguinte à festa, saindo da casa de alguém da associação com uma mochila preta.",
      3: "Por baixo do malote falso, ainda havia a etiqueta de preço da papelaria do bairro."
    },
    falsas: [
      { texto: "Pegadas de tênis tamanho 40, igual ao do Kauã, na terra embaixo da janela quebrada.", origem: "Sala do cofre" },
      { texto: "Neusa comentou com uma cliente: \"essa festa vai ter um final que ninguém espera\".", origem: "Praça e barracas" },
      { texto: "O claviculário da portaria estava destrancado quando a polícia chegou.", origem: "Portaria" },
      { texto: "Dona Zilda depositou R$ 5 mil na própria conta na segunda de manhã.", origem: "Mesa de contagem" }
    ]
  },

  /* ------------------------------------------------------ */
  {
    id: "pousada",
    titulo: "Noite de Temporal",
    subtitulo: "Pousada Serra Azul · estrada bloqueada",
    dificuldade: "Difícil",
    capa: "⛈️",
    intro: [
      "Heitor Valadares, 60 anos, o escritor de romances policiais mais vendido do país, passava o fim de semana na Pousada Serra Azul para terminar seu novo livro.",
      "Às 22h, um temporal derrubou a luz. Quando a energia voltou, ninguém notou nada. Às 23h, o dono da pousada encontrou Heitor morto na biblioteca.",
      "A ponte caiu com a chuva. Ninguém entra, ninguém sai. O assassino está entre os hóspedes."
    ],
    vitima: "Heitor Valadares, escritor, 60 anos",
    suspeitos: [
      { id: "s1", nome: "Clara Valadares", idade: 50, ocupacao: "Esposa de Heitor", descricao: "Elegante, cabelos curtos e grisalhos. O casamento andava frio." },
      { id: "s2", nome: "Diego Mota", idade: 42, ocupacao: "Editor de Heitor", descricao: "Nervoso. Heitor ameaçava trocar de editora." },
      { id: "s3", nome: "Sofia Lins", idade: 29, ocupacao: "Ex-assistente de Heitor", descricao: "Cabelos longos e escuros. Chegou à pousada sem reserva." },
      { id: "s4", nome: "Wagner", idade: 55, ocupacao: "Dono da pousada", descricao: "Hospitaleiro e cansado. A pousada vive cheia de goteiras." },
      { id: "s5", nome: "Dr. Paulo Reis", idade: 63, ocupacao: "Médico, amigo de infância", descricao: "Hóspede antigo. Foi quem examinou o corpo." }
    ],
    metodos: [
      { id: "m1", nome: "Veneno no conhaque" },
      { id: "m2", nome: "Golpe com a estatueta de bronze" },
      { id: "m3", nome: "Tiro com o revólver da pousada" },
      { id: "m4", nome: "Empurrão na escada" }
    ],
    motivos: [
      { id: "o1", nome: "Herança e seguro de vida" },
      { id: "o2", nome: "Plágio: ele roubou um livro" },
      { id: "o3", nome: "Contrato de edição cancelado" },
      { id: "o4", nome: "Dívida da pousada" }
    ],
    solucao: {
      culpado: "s3", metodo: "m2", motivo: "o2",
      explicacao: "Dois anos atrás, Sofia enviou à editora o romance \"Casa das Sombras\". Quem leu e recusou foi Heitor, que depois reescreveu a história como se fosse sua. Sofia descobriu, seguiu Heitor até a pousada e, no escuro da queda de energia, entrou na biblioteca. Na discussão, golpeou-o com a estatueta de bronze, lavou a estatueta no banheiro do corredor e subiu ao quarto 7 de cabelo molhado, onde Wagner a viu."
    },
    locais: [
      { id: "l1", nome: "Biblioteca", icone: "📚", pistas: [
        "Ferimento na cabeça. A estatueta de bronze da lareira está limpa demais e ainda úmida: alguém a lavou.",
        "Sobre a mesa, o manuscrito do novo livro, \"A Casa das Sombras\". Na margem, anotações a lápis em outra letra: \"cena MINHA, capítulo MEU\"."
      ]},
      { id: "l2", nome: "Bar da pousada", icone: "🥃", pistas: [
        "Um teste rápido no copo de conhaque de Heitor não encontrou nenhuma substância estranha.",
        "Anotação do barman: Clara e Diego ficaram no bar das 21h30 às 23h, discutindo um contrato. Não saíram."
      ]},
      { id: "l3", nome: "Recepção", icone: "🛎️", pistas: [
        "O revólver da pousada está no cofre da recepção, com as seis balas no tambor. Não foi disparado.",
        "Livro de hóspedes: \"Quarto 7 — Sofia Lins. Chegou sem reserva, uma hora antes do temporal.\""
      ]},
      { id: "l4", nome: "Corredor e escada", icone: "🪜", pistas: [
        "Pegadas molhadas de sapato pequeno vão do banheiro do corredor até a porta do quarto 7.",
        "No cesto do banheiro do corredor, uma toalha molhada com manchas rosadas, de algo que foi lavado às pressas."
      ]},
      { id: "l5", nome: "Quartos dos hóspedes", icone: "🛏️", pistas: [
        "No quarto 7, uma cópia impressa de um romance chamado \"Casa das Sombras\", datada de dois anos atrás. O nome do autor foi arrancado da capa.",
        "No quarto 3, do casal Valadares, uma apólice de seguro de vida de R$ 2 milhões, com Clara como beneficiária, assinada há dez anos."
      ]}
    ],
    depoimentos: {
      s1: [
        "\"Passei a noite no bar com o Diego, brigando por causa do contrato. O barman viu tudo.\"",
        "\"O seguro? Heitor fez há dez anos. Eu nem lembrava que existia. Dinheiro eu tenho de sobra.\""
      ],
      s2: [
        "\"Heitor ia me entregar 'A Casa das Sombras' semana que vem. Dizia que era o melhor livro da vida dele, escrito em seis meses.\"",
        "\"Ele queria mudar de editora, sim. Mas esse livro ainda era meu por contrato. A morte dele só me dá prejuízo.\""
      ],
      s3: [
        "\"Fui assistente do Heitor anos atrás. Estou aqui por acaso, foi a chuva que me prendeu.\"",
        "\"Às 22h eu já estava dormindo no meu quarto. Não ouvi nada, não vi nada.\""
      ],
      s4: [
        "\"A luz caiu às 22h. Desci ao porão pra ligar o gerador e só voltei às 22h25.\"",
        "\"Logo que a luz voltou, vi uma moça de cabelo comprido e molhado subindo a escada do corredor, apressada.\""
      ],
      s5: [
        "\"Examinei o corpo: morreu entre 22h e 22h30, com uma pancada na cabeça. Nada de veneno, nada de tiro.\"",
        "\"Há um mês o Heitor me disse, rindo: 'esse livro novo não é bem meu'. Achei que fosse brincadeira.\""
      ]
    },
    dossies: {
      perito: "LAUDO: o corpo não tem marcas de queda. A pancada veio de um objeto pesado e arredondado, desferida por alguém de pé atrás da cadeira.",
      investigador: "E-MAILS DE HEITOR: há um mês, Sofia escreveu: \"Você não tem esse direito. Aquele livro é meu e eu vou provar.\"",
      escrivao: "REGISTRO: a luz caiu às 22h e voltou às 22h25. O corpo foi encontrado por Wagner às 23h.",
      arquivista: "ARQUIVO DA EDITORA: há dois anos, um manuscrito chamado \"Casa das Sombras\", de uma autora iniciante, foi recusado. O parecer foi assinado por Heitor Valadares.",
      fotografo: "FOTO DA BIBLIOTECA (21h): a estatueta de bronze aparece sobre a lareira, ao lado de um porta-retratos.",
      analista: "FINANÇAS: a pousada não tem dívidas. Clara tem patrimônio próprio maior que o do marido."
    },
    novidades: {
      2: "A ponte caiu às 20h. Ninguém entrou nem saiu da pousada desde então: o culpado está entre os cinco suspeitos.",
      3: "Um fio de cabelo longo e escuro foi encontrado preso na base da estatueta de bronze."
    },
    falsas: [
      { texto: "Na bolsa de Clara, uma nota fiscal de veneno de rato comprado na cidade ontem.", origem: "Quartos dos hóspedes" },
      { texto: "Falta uma bala no tambor do revólver da pousada.", origem: "Recepção" },
      { texto: "Diego saiu do bar às 22h10 e só voltou às 22h40, segundo o barman.", origem: "Bar da pousada" },
      { texto: "Wagner devia R$ 300 mil a Heitor, que emprestou dinheiro para a reforma da pousada.", origem: "Recepção" }
    ]
  }
];

var ESPECIALIDADES = [
  { id: "perito",       nome: "Perito(a)",       icone: "🔬", desc: "Você recebeu o laudo da perícia." },
  { id: "investigador", nome: "Investigador(a)", icone: "📱", desc: "Você teve acesso a celulares e mensagens." },
  { id: "escrivao",     nome: "Escrivão(ã)",     icone: "📝", desc: "Você tem o registro oficial dos horários." },
  { id: "arquivista",   nome: "Arquivista",      icone: "🗂️", desc: "Você consultou cartórios e arquivos." },
  { id: "fotografo",    nome: "Fotógrafo(a)",    icone: "📷", desc: "Você tem as fotos tiradas na cena." },
  { id: "analista",     nome: "Analista",        icone: "📊", desc: "Você examinou contas e cadastros." }
];

if (typeof module !== "undefined") module.exports = { CASOS: CASOS, ESPECIALIDADES: ESPECIALIDADES };
