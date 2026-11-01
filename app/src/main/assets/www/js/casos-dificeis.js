/* =========================================================
   CASO ABERTO — Casos novos · nível DIFÍCIL
   ========================================================= */
CASOS.push(
  /* ------------------------------------------------------ */
  {
    id: "teatro",
    titulo: "O Último Ato",
    subtitulo: "Teatro Municipal · noite de estreia",
    dificuldade: "Difícil",
    capa: "🎭",
    intro: [
      "Dalva Monteiro, a maior atriz da cidade, estreava a peça que ela mesma escreveu. O teatro estava lotado.",
      "No último ato, Dalva bebeu da taça de cena, disse sua última fala e caiu no palco. A plateia aplaudiu, achando que fazia parte da peça. Ela não se levantou mais.",
      "A taça é a primeira suspeita. Mas em teatro, nem tudo é o que parece."
    ],
    vitima: "Dalva Monteiro, atriz, 55 anos",
    suspeitos: [
      { id: "s1", nome: "Rodrigo Prado", idade: 35, ocupacao: "Ator, par romântico de Dalva", descricao: "Contracena com ela no último ato. Bebe da mesma taça." },
      { id: "s2", nome: "Silvana Reis", idade: 48, ocupacao: "Diretora da peça", descricao: "Perfeccionista. Brigava com Dalva em todo ensaio." },
      { id: "s3", nome: "Jéssica Lopes", idade: 24, ocupacao: "Atriz substituta", descricao: "Sabe o papel de Dalva de cor. Só sobe ao palco se Dalva faltar." },
      { id: "s4", nome: "Osmar", idade: 60, ocupacao: "Contra-regra", descricao: "Cuida de todos os objetos de cena, inclusive das taças." },
      { id: "s5", nome: "Teodoro Monteiro", idade: 52, ocupacao: "Marido de Dalva e produtor", descricao: "Bancou a peça. Sempre dá um presente à esposa nas estreias." }
    ],
    metodos: [
      { id: "m1", nome: "Veneno na taça de cena" },
      { id: "m2", nome: "Veneno no batom" },
      { id: "m3", nome: "Veneno na garrafa d'água do camarim" },
      { id: "m4", nome: "Troca do remédio no camarim" }
    ],
    motivos: [
      { id: "o1", nome: "Ficar com o papel principal" },
      { id: "o2", nome: "Receber o seguro de vida" },
      { id: "o3", nome: "Vingança por plágio da peça" },
      { id: "o4", nome: "Esconder um caso amoroso" }
    ],
    solucao: {
      culpado: "s5", metodo: "m2", motivo: "o2",
      explicacao: "A produtora de Teodoro devia R$ 900 mil, e Dalva ia pedir o divórcio depois da estreia. Com o divórcio, ele perderia o seguro de vida dela, que tinha triplicado um mês antes. Teodoro misturou veneno num batom vermelho novo e deu de presente à esposa, com um cartão. No intervalo, Dalva retocou a maquiagem com o batom, como sempre fazia antes do último ato. O veneno agiu durante a cena. A taça, que todo mundo olhou, estava limpa."
    },
    locais: [
      { id: "l1", nome: "Palco", icone: "🎭", pistas: [
        "A taça de cena caída no palco tem só suco de uva. O laboratório não achou nada nela.",
        "Na gola do figurino da vítima, uma marca de batom vermelho borrado."
      ]},
      { id: "l2", nome: "Camarim da estrela", icone: "💄", pistas: [
        "Na penteadeira, um batom vermelho novo com laço de presente e um cartão: \"Para a minha estrela. T.\"",
        "A garrafa d'água do camarim está lacrada. Ninguém bebeu dela."
      ]},
      { id: "l3", nome: "Depósito de objetos de cena", icone: "📦", pistas: [
        "Há duas taças iguais. O contra-regra trocou uma delas no intervalo porque estava lascada.",
        "No caderno de cena: \"taça trocada às 21h10 — Osmar\"."
      ]},
      { id: "l4", nome: "Camarim da substituta", icone: "🪞", pistas: [
        "No espelho de Jéssica, fotos de Dalva riscadas com caneta vermelha.",
        "O figurino da substituta está pronto, com o nome dela costurado. Foi feito há um mês."
      ]},
      { id: "l5", nome: "Escritório da produção", icone: "💼", pistas: [
        "Na gaveta, a apólice do seguro de vida de Dalva. O valor foi triplicado há um mês. Beneficiário: Teodoro.",
        "Avisos de cobrança de três bancos: a produtora deve R$ 900 mil."
      ]}
    ],
    depoimentos: {
      s1: [
        "“Eu bebo da mesma taça na cena. Bebi logo depois dela e estou ótimo.”",
        "“No intervalo, vi o Teodoro entrando no camarim da Dalva com um pacotinho de presente.”"
      ],
      s2: [
        "“A Jéssica ensaiou escondida o papel da Dalva por semanas.”",
        "“A Dalva tinha uma mania: retocar o batom no intervalo, antes do último ato. Nunca falhava.”"
      ],
      s3: [
        "“Eu não gostava dela, sim. Ela me humilhava. Mas fiquei na coxia o intervalo inteiro, ajudando no figurino.”",
        "“O figurino foi a diretora que mandou fazer. Substituta tem que estar sempre pronta.”"
      ],
      s4: [
        "“Troquei a taça porque estava lascada, e lavei a nova eu mesmo.”",
        "“Depois que troquei, ninguém mexeu nas taças. Ficaram na mesa de cena, bem na minha frente.”"
      ],
      s5: [
        "“Dei um batom para dar sorte, como em toda estreia.”",
        "“O seguro? Toda atriz tem. Aumentei porque ela ficou mais famosa.”"
      ]
    },
    dossies: {
      perito: "LAUDO: o veneno entrou pela boca, mas a taça está limpa. Os lábios da vítima têm muito mais veneno que o resto do corpo.",
      investigador: "CELULAR DA VÍTIMA: mensagem para uma amiga, ontem: \"Depois da estreia, vou pedir o divórcio. Não aguento mais.\"",
      escrivao: "HORÁRIOS: intervalo das 21h às 21h15. Dalva retoca a maquiagem às 21h05. Último ato às 21h20. Desmaio às 21h35.",
      arquivista: "CARTÓRIO: a peça foi registrada por Dalva há dez anos. Não existe nenhum processo de plágio.",
      fotografo: "FOTO DO INTERVALO (21h05): Dalva no espelho passando batom vermelho. O laço de presente está sobre a mesa.",
      analista: "BANCOS: as dívidas da produtora de Teodoro vencem este mês."
    },
    novidades: {
      2: "O laboratório confirmou: não havia veneno em nenhuma das duas taças, nem na trocada nem na original.",
      3: "A seguradora informou: se o casal se divorciasse, Teodoro deixaria de ser o beneficiário do seguro de vida."
    },
    falsas: [
      { texto: "No fundo da taça trocada, um pó branco grudado no vidro.", origem: "Depósito de objetos de cena" },
      { texto: "Jéssica foi vista entrando no camarim da estrela às 21h05.", origem: "Camarim da estrela" },
      { texto: "Na gaveta da substituta, um frasco pequeno sem rótulo.", origem: "Camarim da substituta" },
      { texto: "Rodrigo cuspiu o suco escondido ao sair de cena.", origem: "Palco" }
    ]
  },

  /* ------------------------------------------------------ */
  {
    id: "ilha",
    titulo: "Lua Cheia no Remanso",
    subtitulo: "Ilha do Remanso · Rio São Francisco",
    dificuldade: "Difícil",
    capa: "🌕",
    intro: [
      "Seu Severino Bastos era o dono da Ilha do Remanso, no meio do São Francisco. Vivia sozinho na casa da ilha e só atravessava o rio no barco a motor de Damião.",
      "Na noite de lua cheia, Damião fez as últimas travessias para a cidade às 22h e às 23h. Às 6h, um pescador encontrou o corpo de Severino boiando perto do píer da ilha.",
      "Todos os suspeitos juram que estavam na cidade. Mas o rio guarda segredos, e nem toda travessia faz barulho."
    ],
    vitima: "Severino Bastos, 64 anos, dono da ilha",
    suspeitos: [
      { id: "s1", nome: "Damião", idade: 40, ocupacao: "Barqueiro", descricao: "Único barco a motor da ilha. Severino lhe devia dois meses de travessia." },
      { id: "s2", nome: "Cleide Bastos", idade: 37, ocupacao: "Sobrinha de Severino", descricao: "Tem procuração para cuidar dos negócios do tio." },
      { id: "s3", nome: "Valter Mendes", idade: 55, ocupacao: "Fazendeiro vizinho", descricao: "Quer as terras da ilha para plantar. Faz qualquer negócio." },
      { id: "s4", nome: "Dona Benedita", idade: 68, ocupacao: "Benzedeira, moradora da ilha", descricao: "Mora na outra ponta da ilha. Escuta tudo à noite." },
      { id: "s5", nome: "Ricardo Assis", idade: 33, ocupacao: "Biólogo do projeto do rio", descricao: "Brigava com Severino por causa da pesca na ilha." }
    ],
    metodos: [
      { id: "m1", nome: "Afogou a vítima no remanso" },
      { id: "m2", nome: "Golpe com um remo" },
      { id: "m3", nome: "Envenenamento com timbó" },
      { id: "m4", nome: "Empurrão do barranco" }
    ],
    motivos: [
      { id: "o1", nome: "Herança" },
      { id: "o2", nome: "Esconder a venda ilegal das terras" },
      { id: "o3", nome: "Proteger o rio da pesca" },
      { id: "o4", nome: "Dívida do barco" }
    ],
    solucao: {
      culpado: "s2", metodo: "m2", motivo: "o2",
      explicacao: "Um mês antes, usando a procuração, Cleide vendeu metade da ilha a Valter sem o tio saber, e ficou com o dinheiro. Severino descobriu e ia revogar a procuração na segunda, o que anularia a venda. Cleide atravessou para a cidade às 22h no barco de Damião, para ter álibi. Às 23h20, pegou escondida a canoa do projeto, que fica na margem da cidade, e remou de volta para a ilha sem fazer barulho. No píer, discutiu com o tio e o golpeou com o remo reserva da canoa. Ele caiu no rio. Ela remou de volta e chegou à cidade molhada, à 0h50."
    },
    locais: [
      { id: "l1", nome: "Píer da ilha", icone: "⚓", pistas: [
        "Nas frestas da madeira do píer, uma mancha de sangue que alguém tentou lavar.",
        "Jogado no mato, perto do píer, um remo partido ao meio."
      ]},
      { id: "l2", nome: "Casa de Severino", icone: "🏡", pistas: [
        "Na mesa, o rascunho de uma carta ao cartório: \"Revogo a procuração dada à minha sobrinha.\"",
        "O lampião ainda estava aceso e a cama não foi desfeita."
      ]},
      { id: "l3", nome: "Canoa do biólogo", icone: "🛶", pistas: [
        "A canoa do projeto fica amarrada na margem da cidade. Hoje amanheceu molhada por dentro e sem o remo reserva.",
        "No fundo da canoa, um brinco de argola dourada."
      ]},
      { id: "l4", nome: "Barco do Damião", icone: "🚤", pistas: [
        "Caderno do barqueiro: \"22h — Cleide para a cidade. 23h — Valter para a cidade.\"",
        "O motor do barco ficou frio a noite inteira depois das 23h30."
      ]},
      { id: "l5", nome: "Bar da margem", icone: "🍺", pistas: [
        "O dono do bar viu uma mulher remando para o lado da ilha perto das 23h20, sem lanterna.",
        "À 0h50, a mesma mulher passou molhada até a cintura, voltando para a cidade a pé."
      ]}
    ],
    depoimentos: {
      s1: [
        "“Levei a Cleide às 22h e o Valter às 23h. Depois disso, meu barco não saiu mais.”",
        "“O Valter ficou no bar comigo jogando sinuca até as 2h.”"
      ],
      s2: [
        "“Às 22h fui para a cidade e dormi na casa de uma amiga.”",
        "“Meu tio me deu a procuração porque confiava em mim. Eu cuido de tudo pra ele.”"
      ],
      s3: [
        "“Quero as terras, todo mundo sabe. Mas compro com papel passado no cartório.”",
        "“Fiz negócio com a sobrinha, que tem procuração. Achei que o velho sabia.”"
      ],
      s4: [
        "“Ontem o Severino me disse: \"Fui enganado pela minha própria família.\"”",
        "“Perto da meia-noite ouvi barulho de remo batendo na água. Motor, nenhum.”"
      ],
      s5: [
        "“Minha canoa fica na margem da cidade, com um remo reserva. Hoje o remo sumiu.”",
        "“Eu brigava com o Severino por causa da pesca, mas em reunião. Nunca encostei nele.”"
      ]
    },
    dossies: {
      perito: "LAUDO: pancada forte na cabeça com um objeto de madeira, depois a queda no rio. Morte entre 23h30 e 0h30.",
      investigador: "CELULAR DE CLEIDE: mensagem de Valter às 21h: \"Seu tio descobriu a venda. Resolva isso hoje.\"",
      escrivao: "HORÁRIOS: travessias às 22h e às 23h. Motor parado às 23h30. Corpo achado às 6h.",
      arquivista: "CARTÓRIO: há um mês, com a procuração, Cleide vendeu metade da ilha a Valter. Severino não assinou nada.",
      fotografo: "FOTO DA FESTA NA CIDADE (19h): Cleide usa brincos de argola dourada.",
      analista: "BANCO: o dinheiro da venda caiu na conta de Cleide. Nem um centavo foi para Severino."
    },
    novidades: {
      2: "O remo partido achado no píer é o remo reserva da canoa do projeto, que fica do outro lado do rio, na margem da cidade.",
      3: "O cartório confirmou: Severino tinha hora marcada na segunda para revogar a procuração. Com isso, a venda de metade da ilha seria anulada."
    },
    falsas: [
      { texto: "No píer, pegadas de bota grande de homem, indo para o mato.", origem: "Píer da ilha" },
      { texto: "Na cozinha da casa, uma garrafa com restos de timbó.", origem: "Casa de Severino" },
      { texto: "O motor do barco do Damião ainda estava quente à 0h30.", origem: "Barco do Damião" },
      { texto: "O dono do bar viu Ricardo saindo de canoa à meia-noite.", origem: "Bar da margem" }
    ]
  },

  /* ------------------------------------------------------ */
  {
    id: "mansao",
    titulo: "O Relógio Parado",
    subtitulo: "Mansão dos Albuquerque · noite de Réveillon",
    dificuldade: "Difícil",
    capa: "🕰️",
    intro: [
      "Todo Réveillon, o Comendador Aurélio Albuquerque reúne a família na mansão. Este ano, ele prometeu um anúncio à meia-noite.",
      "Às 0h10, com os fogos já terminando, a governanta encontrou o Comendador morto no jardim dos fundos, embaixo da sacada do escritório. Ao lado dele, o relógio de mesa do escritório, quebrado, parado em 23h45.",
      "Às 23h45, estava todo mundo no terraço vendo os fogos. Ou quase todo mundo. Mas será que o relógio diz a verdade?"
    ],
    vitima: "Comendador Aurélio Albuquerque, 77 anos",
    suspeitos: [
      { id: "s1", nome: "Lívia Albuquerque", idade: 45, ocupacao: "Segunda esposa", descricao: "Casou com o Comendador há cinco anos. A família nunca a aceitou." },
      { id: "s2", nome: "Bernardo Albuquerque", idade: 50, ocupacao: "Filho mais velho", descricao: "Comanda a empresa da família. Esperava herdar quase tudo." },
      { id: "s3", nome: "Joana", idade: 58, ocupacao: "Governanta", descricao: "Trabalha na mansão há trinta anos. Conhece todos os segredos." },
      { id: "s4", nome: "Dr. Sérgio Pontes", idade: 61, ocupacao: "Tabelião e amigo da família", descricao: "Trouxe um documento para o Comendador assinar à meia-noite." },
      { id: "s5", nome: "Murilo Albuquerque", idade: 28, ocupacao: "Neto, filho de Bernardo", descricao: "Tem dívidas com apostas pela internet." }
    ],
    metodos: [
      { id: "m1", nome: "Golpe com o relógio de mesa" },
      { id: "m2", nome: "Veneno no espumante" },
      { id: "m3", nome: "Empurrão da sacada" },
      { id: "m4", nome: "Estrangulamento com o cordão da cortina" }
    ],
    motivos: [
      { id: "o1", nome: "O novo testamento o deixaria sem herança" },
      { id: "o2", nome: "Pagar dívidas de apostas" },
      { id: "o3", nome: "Vingança por anos de humilhação" },
      { id: "o4", nome: "Esconder documentos falsificados" }
    ],
    solucao: {
      culpado: "s2", metodo: "m3", motivo: "o1",
      explicacao: "À meia-noite, o Comendador ia assinar um novo testamento que deixava a casa e a empresa para Lívia e Murilo, e nada para Bernardo. Às 23h10, Bernardo subiu ao escritório pela escada dos fundos, dizendo que ia à adega buscar espumante. Os dois brigaram, e às 23h15 Bernardo empurrou o pai da sacada. Depois desceu ao jardim, abriu o relógio de mesa, girou os ponteiros para 23h45, quebrou o relógio e o deixou ao lado do corpo. Às 23h40, já estava no terraço dos fogos, sendo filmado. Na pressa, rasgou o paletó no parapeito."
    },
    locais: [
      { id: "l1", nome: "Jardim sob a sacada", icone: "🌳", pistas: [
        "O corpo estava embaixo da sacada do escritório, no segundo andar. Os ferimentos são de queda.",
        "O relógio de mesa está quebrado, parado em 23h45. Dentro do vidro, há grãos de terra do jardim."
      ]},
      { id: "l2", nome: "Escritório do Comendador", icone: "📜", pistas: [
        "A porta da sacada está aberta. No parapeito, marcas de sapato social escorregando e um fiapo de tecido escuro preso numa farpa.",
        "Na escrivaninha, o novo testamento, pronto para ser assinado. Não tem assinatura."
      ]},
      { id: "l3", nome: "Adega", icone: "🍾", pistas: [
        "Joana anotou: \"Sr. Bernardo pegou 2 garrafas de espumante às 23h20\".",
        "A escada dos fundos sai do lado da adega e sobe direto para o escritório."
      ]},
      { id: "l4", nome: "Terraço dos fogos", icone: "🎆", pistas: [
        "Os fogos começaram às 23h40. O terraço fica na frente da casa e não tem vista para o jardim dos fundos.",
        "Um convidado filmou o terraço das 23h40 à meia-noite: Bernardo, Lívia, Murilo e o tabelião aparecem. Joana, não."
      ]},
      { id: "l5", nome: "Quarto de Murilo", icone: "🛏️", pistas: [
        "Cartas de cobrança de um site de apostas: R$ 60 mil.",
        "Um bilhete do avô: \"Paguei tudo. Agora largue as apostas. Com amor, vovô.\""
      ]}
    ],
    depoimentos: {
      s1: [
        "“Meu marido estava feliz. Ia mudar o testamento e me disse que eu ficaria bem.”",
        "“Às 23h15 ouvi um baque lá fora, mas achei que era um rojão adiantado.”"
      ],
      s2: [
        "“Às 23h45 eu estava no terraço vendo os fogos. Está no vídeo.”",
        "“Fui à adega buscar espumante e voltei direto para a sala. Não subi escada nenhuma.”"
      ],
      s3: [
        "“Aquele relógio é de corda. Se cai, para na hora da queda. A não ser que alguém mexa nos ponteiros.”",
        "“Às 23h20 vi o Sr. Bernardo descendo a escada dos fundos com o paletó amassado. Só depois foi pegar o espumante.”"
      ],
      s4: [
        "“O novo testamento deixava a casa e a empresa para Lívia e Murilo. Bernardo não ficava com nada.”",
        "“Às 23h, o Comendador me disse: \"O Bernardo ainda não sabe. Vai saber à meia-noite.\"”"
      ],
      s5: [
        "“Eu devia, sim. Mas meu avô pagou tudo ontem. Por que eu faria mal a ele?”",
        "“Às 23h10 ouvi meu pai e meu avô brigando no escritório. Fiquei no quarto até os fogos.”"
      ]
    },
    dossies: {
      perito: "LAUDO: a morte foi entre 23h10 e 23h25, não às 23h45. A queda foi da sacada do escritório.",
      investigador: "CELULAR DE BERNARDO: pesquisa às 22h: \"testamento não assinado tem validade?\"",
      escrivao: "HORÁRIOS: tabelião no escritório às 23h. Briga ouvida às 23h10. Baque às 23h15. Fogos às 23h40. Corpo achado às 0h10.",
      arquivista: "CARTÓRIO: sem o novo testamento, vale o antigo. Nele, Bernardo herda 60% de tudo.",
      fotografo: "FOTO DAS 23h25 (selfie de Lívia na sala): ao fundo, Bernardo entra com o paletó rasgado no ombro.",
      analista: "BANCO: as dívidas de Murilo foram pagas pelo avô ontem, às 15h."
    },
    novidades: {
      2: "O perito confirmou: o relógio foi aberto e os ponteiros foram girados com a mão. A hora de 23h45 é falsa.",
      3: "O alfaiate da família reconheceu o fiapo de tecido preso no parapeito da sacada: é do paletó de Bernardo."
    },
    falsas: [
      { texto: "Na lixeira do escritório, o testamento antigo rasgado, com anotações na letra de Lívia.", origem: "Escritório do Comendador" },
      { texto: "No vídeo dos fogos, Murilo some por dez minutos, das 23h45 às 23h55.", origem: "Terraço dos fogos" },
      { texto: "Joana pegou uma lata de veneno de rato na prateleira da adega.", origem: "Adega" },
      { texto: "No pescoço da vítima, uma marca fina, como de um cordão de cortina.", origem: "Jardim sob a sacada" }
    ]
  },

  /* ------------------------------------------------------ */
  {
    id: "radio",
    titulo: "Silêncio no Ar",
    subtitulo: "Rádio Sertaneja FM · programa da madrugada",
    dificuldade: "Difícil",
    capa: "📻",
    intro: [
      "Zeca Batista apresentava o programa de denúncias mais ouvido do Norte de Minas. A semana inteira ele anunciou: \"Na segunda, uma bomba que vai abalar a cidade.\"",
      "À 0h54, entrou no ar uma música de seis minutos. Depois dela, quatro minutos de silêncio. À 1h04, a operadora de som encontrou Zeca caído sobre a mesa do estúdio.",
      "Todo mundo acha que sabe quem era o alvo da denúncia. Talvez estejam todos enganados."
    ],
    vitima: "Zeca Batista, 52 anos, locutor",
    suspeitos: [
      { id: "s1", nome: "Dorival Santana", idade: 56, ocupacao: "Dono de empresa de ônibus", descricao: "Zeca vivia criticando os ônibus dele no ar. Todos acham que a denúncia era sobre ele." },
      { id: "s2", nome: "Elaine", idade: 34, ocupacao: "Operadora de som", descricao: "Trabalha com Zeca toda madrugada. Achou o corpo." },
      { id: "s3", nome: "Marquinhos", idade: 29, ocupacao: "Locutor do horário seguinte", descricao: "Sonha com o horário de Zeca, o de maior audiência." },
      { id: "s4", nome: "Dona Zuleica", idade: 63, ocupacao: "Ouvinte fiel", descricao: "Liga para o programa toda madrugada. Fã número um de Zeca." },
      { id: "s5", nome: "Haroldo Viana", idade: 50, ocupacao: "Dono da rádio", descricao: "Comprou a rádio há três anos. Anda de carro novo." }
    ],
    metodos: [
      { id: "m1", nome: "Choque no microfone adulterado" },
      { id: "m2", nome: "Golpe com o troféu da rádio" },
      { id: "m3", nome: "Veneno no café da garrafa térmica" },
      { id: "m4", nome: "Estrangulamento com cabo de áudio" }
    ],
    motivos: [
      { id: "o1", nome: "Impedir uma denúncia ao vivo" },
      { id: "o2", nome: "Ficar com o horário do programa" },
      { id: "o3", nome: "Receber o seguro da rádio" },
      { id: "o4", nome: "Obsessão de fã" }
    ],
    solucao: {
      culpado: "s5", metodo: "m3", motivo: "o1",
      explicacao: "A bomba de segunda não era sobre Dorival: era sobre a própria rádio. Haroldo usava anúncios de empresas que não existem para lavar dinheiro, e Zeca tinha as provas. Haroldo espalhou que a denúncia era contra Dorival, para desviar a atenção. À 0h30, chegou à rádio no seu sedã preto, levou uma garrafa térmica de café com veneno de rato e ofereceu a Zeca. À 0h50, ligou para a operadora e mandou soltar uma música longa, para que ninguém percebesse o locutor passando mal. Saiu à 1h15, com os faróis apagados."
    },
    locais: [
      { id: "l1", nome: "Estúdio", icone: "🎙️", pistas: [
        "O microfone e a mesa de som estão em perfeito estado. Nenhum fio foi mexido.",
        "A garrafa térmica de café está quase vazia. A xícara do locutor tem um resto escuro e amargo no fundo."
      ]},
      { id: "l2", nome: "Técnica de som", icone: "🎚️", pistas: [
        "O registro da programação mostra: à 0h54, uma música de seis minutos foi colocada \"a pedido da direção\".",
        "Depois da música, quatro minutos de silêncio no ar, até a operadora voltar."
      ]},
      { id: "l3", nome: "Copa da rádio", icone: "☕", pistas: [
        "A cafeteira da copa está limpa e seca. O café da garrafa térmica não foi feito aqui.",
        "No lixo da copa, uma embalagem rasgada de veneno de rato."
      ]},
      { id: "l4", nome: "Gaveta do locutor", icone: "📂", pistas: [
        "Um envelope: \"DENÚNCIA DE SEGUNDA — lavagem de dinheiro pela própria rádio. Provas em anexo.\"",
        "Um bilhete na letra de Zeca: \"Dorival: deixa ele achar que é com ele. Distrai o patrão.\""
      ]},
      { id: "l5", nome: "Estacionamento", icone: "🚗", pistas: [
        "A câmera do estacionamento mostra um carro escuro chegando à 0h30 e saindo à 1h15. A placa não aparece.",
        "À 1h05, Dorival chegou de carro branco, buzinou no portão fechado e foi embora sem entrar."
      ]}
    ],
    depoimentos: {
      s1: [
        "“O Zeca ia me detonar no ar, prometeu a semana inteira. Vim tirar satisfação.”",
        "“Cheguei à 1h05 e o portão estava fechado. Buzinei, ninguém abriu, fui embora.”"
      ],
      s2: [
        "“O Sr. Haroldo me ligou à 0h50 e mandou soltar uma música bem longa. Achei estranho: ele nunca liga de madrugada.”",
        "“Fui fumar lá fora durante a música. Quando voltei, o Zeca não respondia.”"
      ],
      s3: [
        "“Quero o horário dele, todo mundo sabe. Mas eu só chego às 2h.”",
        "“À tarde, vi o Zeca discutindo com o dono da rádio por causa de um envelope.”"
      ],
      s4: [
        "“Liguei à 0h40, como toda noite. O Zeca atendeu e disse que estava tomando \"um cafezinho que o patrão trouxe\".”",
        "“Eu amava ouvir o Zeca. Nunca faria mal a ele.”"
      ],
      s5: [
        "“Passei a noite em casa. Não pisei na rádio.”",
        "“O Zeca ia denunciar o Dorival. Essa era a bomba da semana, todo mundo sabe.”"
      ]
    },
    dossies: {
      perito: "LAUDO: envenenamento por veneno de rato misturado ao café, tomado entre 0h40 e 0h55.",
      investigador: "CELULAR DE ZECA: mensagem de Haroldo, ontem à tarde: \"Se você ler aquilo no ar, acabou a rádio. E acabou você junto.\"",
      escrivao: "HORÁRIOS: ligação da ouvinte à 0h40. Música longa à 0h54. Silêncio à 1h. Corpo encontrado à 1h04.",
      arquivista: "JUNTA COMERCIAL: a rádio recebeu R$ 2 milhões em anúncios de empresas que não existem.",
      fotografo: "FOTO DA PORTARIA (ontem): o carro de Haroldo é um sedã preto, novo.",
      analista: "BANCO: o dinheiro dos anúncios falsos sai da conta da rádio direto para a conta pessoal de Haroldo."
    },
    novidades: {
      2: "O laboratório confirmou: havia veneno de rato no café da garrafa térmica. O microfone e os cabos estavam perfeitos.",
      3: "Uma vizinha da rádio viu um sedã preto saindo do estacionamento à 1h15, com os faróis apagados."
    },
    falsas: [
      { texto: "Um fio do microfone está desencapado e com marca de queimado.", origem: "Estúdio" },
      { texto: "A câmera mostra Marquinhos chegando à 0h20, e não às 2h.", origem: "Estacionamento" },
      { texto: "Na bolsa de Elaine, pendurada na copa, uma caixa de veneno de rato.", origem: "Copa da rádio" },
      { texto: "Alguém apagou dez minutos do registro da programação.", origem: "Técnica de som" }
    ]
  }
);
