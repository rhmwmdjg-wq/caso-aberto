/* =========================================================
   CASO ABERTO — Casos novos · nível MÉDIO
   ========================================================= */
CASOS.push(
  /* ------------------------------------------------------ */
  {
    id: "museu",
    titulo: "O Retrato do Barão",
    subtitulo: "Museu Casa do Barão · noite de gala",
    dificuldade: "Médio",
    capa: "🖼️",
    intro: [
      "O Museu Casa do Barão comemorava 100 anos com uma festa de gala. A estrela da noite era o retrato do Barão de Itaúna, a peça mais valiosa do acervo.",
      "Às 21h05, a curadora começou o discurso no salão. Às 22h, um convidado subiu à galeria e encontrou só a moldura vazia: a tela tinha sido cortada.",
      "As portas foram fechadas. O quadro sumiu, mas talvez o mistério seja maior do que um roubo."
    ],
    vitima: "O retrato do Barão de Itaúna",
    suspeitos: [
      { id: "s1", nome: "Dra. Irene Saldanha", idade: 55, ocupacao: "Curadora do museu", descricao: "Brigou para fazer a avaliação do seguro. Discursou na hora do crime." },
      { id: "s2", nome: "Fábio Neves", idade: 38, ocupacao: "Restaurador", descricao: "Cuida das telas antigas. Anda com estiletes no bolso do avental." },
      { id: "s3", nome: "Lourenço Teles", idade: 62, ocupacao: "Colecionador", descricao: "Tentou comprar o retrato várias vezes. Nunca conseguiu." },
      { id: "s4", nome: "Patrícia Gomes", idade: 30, ocupacao: "Chefe de segurança", descricao: "Tem a senha das câmeras. Passou a festa na portaria." },
      { id: "s5", nome: "Henrique Pacheco", idade: 44, ocupacao: "Diretor do museu", descricao: "Elegante e cheio de contatos. Dirige o museu há dez anos." }
    ],
    metodos: [
      { id: "m1", nome: "Trocou por uma cópia durante a restauração" },
      { id: "m2", nome: "Desligou as câmeras e cortou a tela durante a festa" },
      { id: "m3", nome: "Saiu com o quadro numa caixa de vinho" },
      { id: "m4", nome: "Desceu pela claraboia do teto" }
    ],
    motivos: [
      { id: "o1", nome: "Pagar dívidas de jogo" },
      { id: "o2", nome: "Encomenda de um colecionador" },
      { id: "o3", nome: "Esconder que o quadro já era falso" },
      { id: "o4", nome: "Vingança contra o museu" }
    ],
    solucao: {
      culpado: "s5", metodo: "m2", motivo: "o3",
      explicacao: "Três anos atrás, o diretor Henrique levou o retrato a uma exposição no exterior, vendeu o original em segredo e trouxe de volta uma cópia. Com a avaliação da seguradora marcada para segunda, a farsa seria descoberta. Durante o discurso da curadora, ele desligou as câmeras com a senha de administrador, subiu à galeria e cortou a tela falsa. Sem quadro, não haveria avaliação, e o roubo esconderia a venda."
    },
    locais: [
      { id: "l1", nome: "Galeria do Barão", icone: "🖼️", pistas: [
        "A moldura ficou na parede, vazia. A tela foi cortada com estilete, rente à moldura.",
        "Lascas de tinta caíram no chão. Por dentro, a tinta ainda está meio macia, como tinta de poucos anos."
      ]},
      { id: "l2", nome: "Sala de segurança", icone: "📹", pistas: [
        "As câmeras foram desligadas às 21h12 pelo sistema, com a senha de administrador.",
        "Só duas pessoas têm a senha de administrador: o diretor e a chefe de segurança."
      ]},
      { id: "l3", nome: "Ateliê de restauração", icone: "🎨", pistas: [
        "No caderno do restaurador: \"Barão: craquelado recente demais?? Falar com a diretoria.\"",
        "Duas fotos do quadro, de antes e de depois da viagem ao exterior: a assinatura mudou de lugar alguns milímetros."
      ]},
      { id: "l4", nome: "Adega da festa", icone: "🍷", pistas: [
        "As caixas de vinho saíram fechadas e foram contadas pelo bufê. Nenhuma faltando.",
        "No lixo da adega, só rolhas e guardanapos."
      ]},
      { id: "l5", nome: "Escritório da diretoria", icone: "🗄️", pistas: [
        "Na agenda do diretor: \"Seguradora — avaliação do Barão — segunda, 9h.\"",
        "Uma pasta de recortes sobre um \"Barão de Itaúna\" vendido num leilão no exterior, há três anos, para um comprador anônimo."
      ]}
    ],
    depoimentos: {
      s1: [
        "“Eu insisti na avaliação da seguradora. O diretor adiou três vezes.”",
        "“Às 21h12 eu estava discursando. Tenho cem testemunhas.”"
      ],
      s2: [
        "“Avisei a diretoria que o quadro parecia mais novo do que devia. Ninguém me respondeu.”",
        "“Passei a festa servindo de guia aos convidados no salão de baixo.”"
      ],
      s3: [
        "“Quis comprar esse quadro a vida inteira. Agora nunca vou ter essa chance.”",
        "“Por volta das 21h15 vi o diretor subindo a escada da galeria, sozinho.”"
      ],
      s4: [
        "“A senha é só minha e do diretor. Eu estava na portaria conferindo convites, a recepcionista ficou do meu lado.”",
        "“Às 21h12 o sistema avisou \"câmeras desligadas pelo administrador\". Achei que o diretor estava fazendo um teste.”"
      ],
      s5: [
        "“Fiquei no salão a noite inteira, recebendo convidados.”",
        "“Esse quadro é o coração do museu. Quem levou quer destruir a nossa história.”"
      ]
    },
    dossies: {
      perito: "PERÍCIA: a tela foi cortada com calma, de cima para baixo, por alguém que não estava com pressa.",
      investigador: "E-MAIL DO DIRETOR (há três anos): \"Transação concluída. Discrição garantida.\" Assinado por um leiloeiro estrangeiro.",
      escrivao: "HORÁRIOS: discurso das 21h05 às 21h25. Câmeras desligadas às 21h12. Sumiço percebido às 22h.",
      arquivista: "ACERVO: o retrato foi a uma exposição no exterior há três anos e voltou dois meses depois. O diretor acompanhou a viagem.",
      fotografo: "FOTO DA GALERIA (21h): o quadro ainda está na parede. Ao fundo, o colecionador admira a tela.",
      analista: "BANCO: há três anos, o diretor quitou o apartamento e comprou uma casa de praia à vista."
    },
    novidades: {
      2: "A seguradora confirmou: a avaliação do retrato estava marcada para segunda-feira e poderia apontar se a tela era original.",
      3: "A tela cortada foi achada num terreno baldio perto do museu. É uma cópia pintada há poucos anos. O original não está no museu há muito tempo."
    },
    falsas: [
      { texto: "No bolso do paletó de Lourenço, um estilete com tinta fresca na lâmina.", origem: "Galeria do Barão" },
      { texto: "A última gravação antes de as câmeras desligarem mostra Patrícia mexendo no painel.", origem: "Sala de segurança" },
      { texto: "Falta uma caixa de vinho na contagem do bufê.", origem: "Adega da festa" },
      { texto: "Atrás de um armário do ateliê, uma tela enrolada escondida.", origem: "Ateliê de restauração" }
    ]
  },

  /* ------------------------------------------------------ */
  {
    id: "algodao",
    titulo: "Fogo no Armazém",
    subtitulo: "Cooperativa do Vale Seco · madrugada de domingo",
    dificuldade: "Médio",
    capa: "🔥",
    intro: [
      "A Cooperativa do Vale Seco guarda o algodão de quarenta famílias de pequenos produtores. Era a safra do ano inteiro.",
      "Às 2h40 da madrugada, a vigia viu fumaça saindo do armazém. Quando os bombeiros chegaram, quase tudo já tinha virado cinza.",
      "Os bombeiros dizem que o fogo não começou sozinho. Alguém queimou o trabalho de quarenta famílias. Quem, como e por quê?"
    ],
    vitima: "O armazém de algodão da cooperativa",
    suspeitos: [
      { id: "s1", nome: "Seu Sebastião", idade: 63, ocupacao: "Presidente da cooperativa", descricao: "Fundou a cooperativa. Fala alto e decide tudo." },
      { id: "s2", nome: "Marta Fonseca", idade: 41, ocupacao: "Contadora da cooperativa", descricao: "Cuida das contas há cinco anos. Muito organizada." },
      { id: "s3", nome: "Josué", idade: 35, ocupacao: "Cooperado expulso", descricao: "Foi expulso mês passado depois de uma briga numa reunião." },
      { id: "s4", nome: "Dênis Araújo", idade: 46, ocupacao: "Comprador de algodão", descricao: "Compra a safra da região para uma fábrica de tecidos." },
      { id: "s5", nome: "Raimunda", idade: 52, ocupacao: "Vigia noturna", descricao: "Anota tudo num caderninho. Viu o fogo primeiro." }
    ],
    metodos: [
      { id: "m1", nome: "Provocou um curto-circuito na fiação" },
      { id: "m2", nome: "Jogou gasolina no fundo do armazém" },
      { id: "m3", nome: "Deixou uma vela acesa sobre estopa" },
      { id: "m4", nome: "Jogou uma bituca de cigarro no algodão" }
    ],
    motivos: [
      { id: "o1", nome: "Receber o dinheiro do seguro" },
      { id: "o2", nome: "Queimar as provas de um desvio de dinheiro" },
      { id: "o3", nome: "Vingança pela expulsão" },
      { id: "o4", nome: "Fazer o preço do algodão subir" }
    ],
    solucao: {
      culpado: "s2", metodo: "m3", motivo: "o2",
      explicacao: "Marta desviava dinheiro da cooperativa havia dois anos, e a prefeitura marcou uma auditoria para segunda. Na véspera, ela tirou os livros-caixa do escritório. Perto da meia-noite, voltou de carro dizendo que tinha esquecido os óculos, acendeu uma vela grande sobre um monte de estopa no fundo do armazém e foi embora. A vela levou mais de duas horas para queimar até a estopa. Quando o fogo começou, Marta já estava em casa."
    },
    locais: [
      { id: "l1", nome: "Fundo do armazém", icone: "🏚️", pistas: [
        "O fogo começou num canto onde havia estopa. No cimento, um pingo grande de cera derretida.",
        "Não há cheiro de gasolina nem marca de galão em lugar nenhum."
      ]},
      { id: "l2", nome: "Escritório da cooperativa", icone: "🗂️", pistas: [
        "As gavetas das notas estão abertas e vazias, mas não há cinza dentro delas: foram esvaziadas antes do fogo.",
        "Sumiram só os livros-caixa dos últimos dois anos. Os mais antigos continuam na estante."
      ]},
      { id: "l3", nome: "Quadro de energia", icone: "⚡", pistas: [
        "Os fios estão inteiros, sem nenhum sinal de curto-circuito.",
        "O disjuntor geral estava desligado desde as 18h, como manda a regra da cooperativa."
      ]},
      { id: "l4", nome: "Guarita da vigia", icone: "🔦", pistas: [
        "No caderno da vigia: \"ronda 22h ok — ronda 0h ok — fogo 2h40\".",
        "Outra anotação: \"23h50 — carro prata entra e sai em 10 minutos\"."
      ]},
      { id: "l5", nome: "Venda da esquina", icone: "🏪", pistas: [
        "O vendeiro vendeu ontem à tarde uma vela grande, de 30 cm, e um rolo de estopa.",
        "Ele não lembra o nome, mas diz que foi \"alguém da cooperativa, que veio de carro prata\"."
      ]}
    ],
    depoimentos: {
      s1: [
        "“O armazém tinha seguro, mas o seguro paga só o prédio. O algodão valia muito mais.”",
        "“Semana passada a Marta me pediu os livros-caixa pra \"organizar\".”"
      ],
      s2: [
        "“Saí às 18h e não voltei mais. Estava em casa dormindo.”",
        "“Os livros-caixa estavam no escritório, como sempre. Devem ter queimado.”"
      ],
      s3: [
        "“Fui expulso injustamente. Mas fogo? Meu próprio algodão estava lá dentro.”",
        "“Me expulsaram porque perguntei, numa reunião, por que as contas não fechavam.”"
      ],
      s4: [
        "“Com o fogo, vou pagar mais caro pelo algodão de outro lugar. Eu perdi dinheiro.”",
        "“Perto da meia-noite passei na estrada e vi um carro prata saindo da cooperativa.”"
      ],
      s5: [
        "“Na ronda da meia-noite não tinha fumaça nenhuma.”",
        "“Um pouco antes, a contadora apareceu dizendo que tinha esquecido os óculos. Entrou e saiu rapidinho.”"
      ]
    },
    dossies: {
      perito: "LAUDO DO FOGO: começou com uma chama pequena, que só ganhou força bem depois. Típico de vela deixada acesa.",
      investigador: "CELULAR DE MARTA: pesquisa feita ontem às 17h: \"quanto tempo dura uma vela de 30 cm\".",
      escrivao: "HORÁRIOS: ronda da meia-noite sem fumaça. Fogo avistado às 2h40. Bombeiros às 3h20.",
      arquivista: "SEGURO: a apólice cobre só o prédio. Com o algodão queimado, a cooperativa perde dinheiro.",
      fotografo: "FOTO DO ESTACIONAMENTO (ontem à tarde): o único carro prata é o da contadora.",
      analista: "PREFEITURA: auditoria nas contas da cooperativa marcada para segunda-feira."
    },
    novidades: {
      2: "Os bombeiros confirmaram: não houve curto-circuito nem gasolina. O fogo começou devagar, num ponto só.",
      3: "A prefeitura informou: na auditoria de segunda, iam pedir justamente os livros-caixa dos últimos dois anos."
    },
    falsas: [
      { texto: "Um galão de gasolina vazio, jogado atrás do armazém.", origem: "Fundo do armazém" },
      { texto: "Um fio desencapado e queimado dentro do quadro de energia.", origem: "Quadro de energia" },
      { texto: "Ontem, Josué comprou querosene e uma caixa de fósforos.", origem: "Venda da esquina" },
      { texto: "A vigia saiu da guarita da meia-noite às 2h e não anotou.", origem: "Guarita da vigia" }
    ]
  },

  /* ------------------------------------------------------ */
  {
    id: "trem",
    titulo: "Expresso da Meia-Noite",
    subtitulo: "Trem turístico Serra Dourada · vagão-leito",
    dificuldade: "Médio",
    capa: "🚂",
    intro: [
      "O trem turístico Serra Dourada faz uma viagem de uma noite entre as cidades históricas. A bordo, o empresário Augusto Bernardes, dono de uma mineradora, viajava com a família e o sócio.",
      "No jantar, Augusto discutiu com o sócio na frente de todos. Às 22h30, ele se recolheu à cabine. De manhã, foi encontrado morto na cama.",
      "O trem só para na próxima estação daqui a três horas. O culpado está a bordo."
    ],
    vitima: "Augusto Bernardes, 68 anos, empresário",
    suspeitos: [
      { id: "s1", nome: "Vera Bernardes", idade: 40, ocupacao: "Filha da vítima", descricao: "Herdeira da mineradora. Brigava com o pai por dinheiro." },
      { id: "s2", nome: "Dr. Cláudio Mattos", idade: 57, ocupacao: "Médico particular", descricao: "Viaja com Augusto e cuida dos remédios dele." },
      { id: "s3", nome: "Nina", idade: 26, ocupacao: "Garçonete do vagão-restaurante", descricao: "Serviu o jantar e o café da noite." },
      { id: "s4", nome: "Tomás Leal", idade: 49, ocupacao: "Sócio da mineradora", descricao: "Quer vender a empresa para um grupo estrangeiro." },
      { id: "s5", nome: "Gilda Rios", idade: 60, ocupacao: "Escritora de guias de viagem", descricao: "Observadora. Anota tudo o que vê num caderninho." }
    ],
    metodos: [
      { id: "m1", nome: "Veneno no café da noite" },
      { id: "m2", nome: "Trocou comprimidos do frasco de remédio" },
      { id: "m3", nome: "Sufocou a vítima com o travesseiro" },
      { id: "m4", nome: "Soltou gás pelo ar-condicionado da cabine" }
    ],
    motivos: [
      { id: "o1", nome: "Herança" },
      { id: "o2", nome: "Conseguir vender a mineradora" },
      { id: "o3", nome: "Vingança por um desastre ambiental" },
      { id: "o4", nome: "Esconder um erro médico" }
    ],
    solucao: {
      culpado: "s4", metodo: "m2", motivo: "o2",
      explicacao: "Tomás estava quase falido, e só a venda da mineradora o salvaria. Augusto se recusava a vender, e pelo contrato, se um sócio morresse, o outro decidiria sozinho. Às 21h40, Tomás entrou na cabine de Augusto e colocou dois comprimidos de um remédio forte para o coração no frasco do remédio de pressão. Às 22h, Augusto tomou o comprimido da noite, como sempre. A mistura parou o coração dele durante o sono."
    },
    locais: [
      { id: "l1", nome: "Cabine do Sr. Augusto", icone: "🛏️", pistas: [
        "No frasco do remédio de pressão, dois comprimidos têm uma cor um pouco diferente dos outros.",
        "A xícara de café está limpa e o travesseiro está arrumado, sem marcas."
      ]},
      { id: "l2", nome: "Vagão-restaurante", icone: "🍽️", pistas: [
        "O café da noite saiu da mesma garrafa para todos os passageiros. Ninguém mais passou mal.",
        "No caderno da garçonete: \"Sr. Tomás pediu para levar o café do Sr. Augusto\". Mas foi ela mesma quem levou."
      ]},
      { id: "l3", nome: "Bagagem do sócio", icone: "🧳", pistas: [
        "Na mala de Tomás, uma cartela de um remédio forte para o coração, com a receita em nome de outra pessoa.",
        "Uma pasta com o contrato de venda da mineradora. Só falta a assinatura de Augusto."
      ]},
      { id: "l4", nome: "Cabine do médico", icone: "🩺", pistas: [
        "A maleta do médico está trancada e completa, conferida com a lista de remédios.",
        "No caderno do médico: \"Augusto — pressão boa — 1 comprimido às 22h, todo dia\"."
      ]},
      { id: "l5", nome: "Corredor do vagão-leito", icone: "🚪", pistas: [
        "O fiscal anotou quem passou pelo corredor depois das 21h: Vera às 21h20 e Tomás às 21h40.",
        "A porta da cabine de Augusto não tranca por dentro. Qualquer um poderia entrar."
      ]}
    ],
    depoimentos: {
      s1: [
        "“Fui dar boa-noite ao meu pai às 21h20. Ele estava bem, reclamando do sócio.”",
        "“Eu brigava com ele por dinheiro, sim. Mas era meu pai.”"
      ],
      s2: [
        "“Preparei os comprimidos da semana eu mesmo. Eram todos iguais.”",
        "“Um comprimido forte para o coração junto com o de pressão pode parar o coração de alguém dormindo.”"
      ],
      s3: [
        "“Levei o café às 21h. O Sr. Tomás quis levar no meu lugar, mas eu não deixo ninguém levar.”",
        "“Às 21h40 vi o Sr. Tomás saindo da cabine do Sr. Augusto, olhando para os lados.”"
      ],
      s4: [
        "“Fui à cabine dele conversar sobre negócios. Ele já estava dormindo e eu saí.”",
        "“A venda? Ele ia assinar. Estava tudo acertado entre nós.”"
      ],
      s5: [
        "“No jantar, Augusto gritou para o sócio: \"Enquanto eu viver, não vendo!\"”",
        "“Vi a filha sair da cabine às 21h25 enxugando os olhos.”"
      ]
    },
    dossies: {
      perito: "LAUDO: o coração parou por causa da mistura do remédio de pressão com um remédio forte para o coração, tomados por volta das 22h.",
      investigador: "CELULAR DE TOMÁS: mensagem ao comprador às 23h: \"Problema resolvido. O contrato sai semana que vem.\"",
      escrivao: "HORÁRIOS: café às 21h. Vera na cabine às 21h20. Tomás às 21h40. Comprimido às 22h. Morte por volta das 22h30.",
      arquivista: "CONTRATO DA MINERADORA: se um sócio morrer, o outro decide sozinho sobre a venda.",
      fotografo: "FOTO DO JANTAR: Augusto aponta o dedo para Tomás. Todos olham para os dois.",
      analista: "FINANÇAS: Tomás está quase falido. A venda da mineradora pagaria todas as dívidas dele."
    },
    novidades: {
      2: "O médico conferiu o frasco: dois comprimidos não são de pressão. São de um remédio forte para o coração que ele nunca receitou.",
      3: "O farmacêutico da última estação reconheceu uma foto: vendeu o remédio do coração a um homem de terno, com uma receita de outra pessoa."
    },
    falsas: [
      { texto: "O travesseiro da vítima tem marcas de mãos apertando com força.", origem: "Cabine do Sr. Augusto" },
      { texto: "Um passageiro viu a garçonete tirar um frasquinho do avental perto do café.", origem: "Vagão-restaurante" },
      { texto: "Está faltando um frasco de remédio na maleta do médico.", origem: "Cabine do médico" },
      { texto: "O fiscal viu Vera voltar à cabine do pai às 22h10.", origem: "Corredor do vagão-leito" }
    ]
  },

  /* ------------------------------------------------------ */
  {
    id: "rodeio",
    titulo: "O Touro Dopado",
    subtitulo: "Rodeio de Vila Poeira · véspera da final",
    dificuldade: "Médio",
    capa: "🐂",
    intro: [
      "O Trovão, touro de Seu Ataliba, é a lenda do Rodeio de Vila Poeira: nenhum peão aguentou oito segundos em cima dele este ano.",
      "Às 20h ele estava bravo como sempre. Às 21h15, a tratadora o encontrou caído na baia, tão mole que mal conseguia ficar de pé.",
      "A final é amanhã e vale R$ 80 mil. Alguém tirou o Trovão da disputa. Quem, como e por quê?"
    ],
    vitima: "Trovão, o touro campeão",
    suspeitos: [
      { id: "s1", nome: "Seu Ataliba", idade: 70, ocupacao: "Dono do Trovão", descricao: "Cria touros há cinquenta anos. Trata o Trovão como filho." },
      { id: "s2", nome: "Wesley", idade: 27, ocupacao: "Peão de rodeio", descricao: "Caiu do Trovão três vezes este ano, na frente da arquibancada." },
      { id: "s3", nome: "Dra. Carla Bueno", idade: 39, ocupacao: "Veterinária do rodeio", descricao: "Cuida de todos os animais da festa." },
      { id: "s4", nome: "Gerson Lobato", idade: 50, ocupacao: "Dono do touro Furacão", descricao: "Seu touro é o segundo melhor do rodeio." },
      { id: "s5", nome: "Lindalva", idade: 33, ocupacao: "Tratadora do Trovão", descricao: "Foi demitida ontem por Seu Ataliba, mas continua cuidando do touro." }
    ],
    metodos: [
      { id: "m1", nome: "Misturou erva venenosa no capim" },
      { id: "m2", nome: "Aplicou uma injeção de calmante" },
      { id: "m3", nome: "Contaminou a água do cocho" },
      { id: "m4", nome: "Deu sal envenenado" }
    ],
    motivos: [
      { id: "o1", nome: "Ganhar a final com outro touro" },
      { id: "o2", nome: "Vingança do peão humilhado" },
      { id: "o3", nome: "Receber o seguro do animal" },
      { id: "o4", nome: "Vingança pela demissão" }
    ],
    solucao: {
      culpado: "s4", metodo: "m2", motivo: "o1",
      explicacao: "Gerson sabia que, sem o Trovão, o Furacão iria direto para a final. Pediu à veterinária um frasco de calmante forte, dizendo que era para o Furacão aguentar a viagem, mas o Furacão já tinha chegado de caminhão no dia anterior. Às 20h30, enquanto todos assistiam à prova, Gerson entrou na baia do Trovão e aplicou o calmante no pescoço do touro. Jogou a seringa no lixo perto do brete."
    },
    locais: [
      { id: "l1", nome: "Baia do Trovão", icone: "🐂", pistas: [
        "No pescoço do Trovão, uma marca pequena de agulha, ainda inchada.",
        "O capim e a água do cocho foram analisados: estão limpos."
      ]},
      { id: "l2", nome: "Brete", icone: "🚧", pistas: [
        "Na lata de lixo perto do brete, uma seringa grande de uso veterinário, sem etiqueta.",
        "No chão de terra, pegadas de bota com espora, tamanho 43."
      ]},
      { id: "l3", nome: "Barraca da veterinária", icone: "💉", pistas: [
        "Falta um frasco de calmante forte na caixa de remédios da veterinária.",
        "No caderno da veterinária: \"emprestei 1 frasco de calmante — Gerson — para o Furacão viajar\"."
      ]},
      { id: "l4", nome: "Curral do Furacão", icone: "🐃", pistas: [
        "O Furacão está agitado e não tem nenhum sinal de ter tomado calmante.",
        "Num balde do curral, embalagens de agulhas veterinárias novas, abertas."
      ]},
      { id: "l5", nome: "Arquibancada", icone: "🏟️", pistas: [
        "Das 20h às 21h, quase todos os peões estavam na arquibancada assistindo à prova.",
        "O telão filmou Wesley na arquibancada a prova inteira, comendo pastel."
      ]}
    ],
    depoimentos: {
      s1: [
        "“O Trovão não tem seguro e não tem preço. Ele é minha vida.”",
        "“Às 20h30 vi o Gerson rondando as baias, de chapéu preto e bota com espora.”"
      ],
      s2: [
        "“Caí três vezes, sim. Mas um dia eu fico os oito segundos em cima dele. Quero ganhar dele de pé.”",
        "“Fiquei na arquibancada a prova toda. Tem até no telão.”"
      ],
      s3: [
        "“Emprestei um frasco de calmante pro Gerson. Ele disse que era pro Furacão aguentar a viagem.”",
        "“Aquele calmante, aplicado no pescoço, deixa um boi mole por dois dias.”"
      ],
      s4: [
        "“Usei o calmante no Furacão, como devia. Ele viaja mal.”",
        "“Nem passei perto da baia do Trovão.”"
      ],
      s5: [
        "“Dei capim e água às 19h. O Trovão comeu tudo e estava ótimo.”",
        "“Fui demitida, mas voltei pra cuidar dele. Eu amo esse boi.”"
      ]
    },
    dossies: {
      perito: "LAUDO VETERINÁRIO: o Trovão recebeu uma dose forte de calmante por injeção no pescoço. Não há veneno no sangue.",
      investigador: "CELULAR DE GERSON: mensagem enviada às 21h: \"Amanhã o Trovão não pula. A final é nossa.\"",
      escrivao: "HORÁRIOS: comida às 19h. Trovão bem às 20h. Trovão caído às 21h15.",
      arquivista: "REGULAMENTO: se o Trovão não puder competir, o Furacão vai direto para a final.",
      fotografo: "FOTO DAS BAIAS (20h30): um homem de chapéu preto e bota com espora, de costas, entrando na baia do Trovão.",
      analista: "PRÊMIO: a final paga R$ 80 mil ao dono do touro campeão."
    },
    novidades: {
      2: "A veterinária confirmou: o Trovão foi dopado com calmante injetado. Não foi veneno.",
      3: "O motorista do caminhão confirmou: o Furacão chegou ontem de manhã e não vai viajar de novo até o fim da festa."
    },
    falsas: [
      { texto: "No cocho da baia, restos de uma erva venenosa misturados ao capim.", origem: "Baia do Trovão" },
      { texto: "Wesley sumiu da arquibancada das 20h20 às 20h50.", origem: "Arquibancada" },
      { texto: "A seringa tem o nome de Lindalva escrito à caneta.", origem: "Brete" },
      { texto: "Sumiu um saco de sal grosso do curral, e ninguém sabe quem levou.", origem: "Curral do Furacão" }
    ]
  }
);
