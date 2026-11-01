/* =========================================================
   CASO ABERTO — Casos novos · nível FÁCIL
   ========================================================= */
CASOS.push(
  /* ------------------------------------------------------ */
  {
    id: "queijo",
    titulo: "O Queijo Campeão",
    subtitulo: "Exposição Agropecuária de Vereda Grande",
    dificuldade: "Fácil",
    capa: "🧀",
    intro: [
      "Na Exposição Agropecuária de Vereda Grande, o queijo do Seu Juvenal ganhou o primeiro lugar pelo quinto ano seguido. No domingo, ele seria leiloado e o lance inicial era de R$ 20 mil.",
      "Às 21h, a jurada lacrou a geladeira da banca com uma fita numerada. À meia-noite, o vigia encontrou a fita cortada e a geladeira vazia.",
      "O leilão é amanhã cedo. Descubram quem levou o queijo, como fez e por quê."
    ],
    vitima: "O queijo campeão, avaliado em R$ 20 mil",
    suspeitos: [
      { id: "s1", nome: "Seu Tonico", idade: 66, ocupacao: "Produtor rival", descricao: "Ficou em segundo lugar pelo terceiro ano. Não esconde a raiva." },
      { id: "s2", nome: "Rosana Lima", idade: 34, ocupacao: "Leiloeira", descricao: "Organiza o leilão e ganha comissão sobre o lance final." },
      { id: "s3", nome: "Valdir", idade: 52, ocupacao: "Vigia do parque", descricao: "Já trabalhou na banca do campeão e foi demitido." },
      { id: "s4", nome: "Caio Prates", idade: 23, ocupacao: "Sobrinho do campeão", descricao: "Ajuda na banca. Sonha em abrir uma lanchonete." },
      { id: "s5", nome: "Dra. Helena Couto", idade: 47, ocupacao: "Jurada do concurso", descricao: "Veterinária rigorosa. Foi ela quem lacrou a geladeira." }
    ],
    metodos: [
      { id: "m1", nome: "Abriu o cadeado com uma cópia da chave" },
      { id: "m2", nome: "Entrou pelo rasgo na lona dos fundos" },
      { id: "m3", nome: "Trocou por um queijo comum na pesagem" },
      { id: "m4", nome: "Levou escondido no isopor da carrocinha de sorvete" }
    ],
    motivos: [
      { id: "o1", nome: "Vender o queijo para um comprador de fora" },
      { id: "o2", nome: "Inveja do campeão" },
      { id: "o3", nome: "Vingança pela demissão" },
      { id: "o4", nome: "Estragar o leilão" }
    ],
    solucao: {
      culpado: "s4", metodo: "m1", motivo: "o1",
      explicacao: "Caio sabia que a chave original ficava num prego atrás da banca. Na quarta-feira, mandou fazer uma cópia no chaveiro da praça. Um comprador de São Paulo ofereceu dinheiro vivo pelo queijo antes do leilão. Às 23h, Caio cortou a fita do lacre com uma tesoura, abriu o cadeado com a cópia e entregou o queijo no estacionamento. Com o dinheiro, pagaria a lanchonete que tinha acabado de registrar."
    },
    locais: [
      { id: "l1", nome: "Banca do campeão", icone: "🧀", pistas: [
        "O cadeado da geladeira está inteiro, sem nenhuma marca de ferramenta. Quem abriu tinha uma chave.",
        "Há um rasgo na lona dos fundos, mas a poeira do chão embaixo dele está lisa, sem nenhuma pegada."
      ]},
      { id: "l2", nome: "Chaveiro da praça", icone: "🔑", pistas: [
        "O chaveiro lembra: na quarta-feira, um rapaz novo pediu a cópia de uma chave pequena de cadeado e pagou em dinheiro.",
        "No caderno do chaveiro, o pedido da cópia está assinado só com as iniciais \"C. P.\""
      ]},
      { id: "l3", nome: "Balança da pesagem", icone: "⚖️", pistas: [
        "A ata registra o queijo campeão com 4,2 kg, conferido pela jurada e por duas testemunhas. Não houve troca na pesagem.",
        "A fita do lacre foi cortada reto, com tesoura. Não foi rasgada às pressas."
      ]},
      { id: "l4", nome: "Carrocinha de sorvete", icone: "🍦", pistas: [
        "O isopor da carrocinha só tem picolé derretido. Nenhum cheiro de queijo.",
        "O sorveteiro fechou às 20h e foi embora com a carrocinha trancada."
      ]},
      { id: "l5", nome: "Estacionamento", icone: "🚙", pistas: [
        "Marcas de pneu de um carro que entrou às 23h e saiu às 23h20, sem ninguém passar pela bilheteria da exposição.",
        "No chão, perto das marcas, uma etiqueta da banca do campeão com o número do lote do queijo."
      ]}
    ],
    depoimentos: {
      s1: [
        "“Perdi três vezes, é verdade. Mas ganhar de um queijo roubado não tem graça nenhuma.”",
        "“Fui dormir cedo na pensão. A dona me viu chegar às 21h e não saí mais.”"
      ],
      s2: [
        "“Sem queijo, sem leilão. Quem mais perdeu fui eu.”",
        "“Um comprador de São Paulo me ligou querendo o queijo antes do leilão. Recusei. Ele disse que ia dar um jeito com alguém da banca.”"
      ],
      s3: [
        "“Fiz a ronda às 22h e estava tudo certo. Na ronda da meia-noite, a fita já estava cortada.”",
        "“Fui demitido da banca no ano passado, mas hoje sou funcionário do parque. Não guardo mágoa.”"
      ],
      s4: [
        "“Eu durmo na barraca do lado da banca para vigiar. Não ouvi nada a noite toda.”",
        "“Meu tio diz que eu não tenho juízo para negócio. Um dia eu mostro pra ele.”"
      ],
      s5: [
        "“Lacrei a geladeira às 21h com a fita número 0458. Estava tudo em ordem.”",
        "“Só eu, o campeão e o sobrinho dele sabíamos onde fica a chave original: num prego atrás da banca.”"
      ]
    },
    dossies: {
      perito: "PERÍCIA: o cadeado foi aberto com chave. A fita do lacre foi cortada com tesoura de ponta fina.",
      investigador: "CELULAR DE CAIO: mensagem de um número de São Paulo às 22h50: \"Chego às 23h no estacionamento. Dinheiro em espécie, como combinado.\"",
      escrivao: "REGISTRO: lacre às 21h. Ronda das 22h, tudo normal. Ronda da meia-noite, lacre cortado. O furto foi entre 22h e 0h.",
      arquivista: "CARTÓRIO: Caio Prates registrou uma lanchonete em seu nome na semana passada.",
      fotografo: "FOTO DAS 21h: a chave original está pendurada no prego atrás da banca, coberta de poeira.",
      analista: "CONTAS: Seu Tonico não tem dívidas. Rosana já recebeu adiantada a comissão do leilão."
    },
    novidades: {
      2: "A chave original continua no prego, ainda coberta de poeira. Quem abriu o cadeado usou uma cópia.",
      3: "A polícia rodoviária parou um comerciante de São Paulo com um queijo de 4,2 kg sem nota. Ele diz que comprou \"de um rapaz da banca\"."
    },
    falsas: [
      { texto: "Embaixo da geladeira há pegadas de bota grande, iguais às botas do vigia.", origem: "Banca do campeão" },
      { texto: "O sorveteiro viu Seu Tonico mexendo no isopor da carrocinha às 23h.", origem: "Carrocinha de sorvete" },
      { texto: "A ata mostra que a jurada pesou o queijo duas vezes, com pesos diferentes.", origem: "Balança da pesagem" },
      { texto: "No estacionamento, um recibo de leilão em nome de Rosana, com data de hoje à noite.", origem: "Estacionamento" }
    ]
  },

  /* ------------------------------------------------------ */
  {
    id: "colar",
    titulo: "O Colar da Noiva",
    subtitulo: "Salão Lua de Prata · festa de casamento",
    dificuldade: "Fácil",
    capa: "💍",
    intro: [
      "Gabriela usou no casamento o colar de esmeraldas da família, que passa de mãe para filha há três gerações.",
      "Às 22h50, ela tirou o colar para dançar e guardou no porta-joias do camarim. Às 23h05, a luz do salão apagou por quatro minutos.",
      "Quando a noiva voltou ao camarim, o porta-joias estava vazio. Os convidados ainda estão no salão. Ninguém sai até o colar aparecer."
    ],
    vitima: "O colar de esmeraldas da família da noiva",
    suspeitos: [
      { id: "s1", nome: "Bruna", idade: 29, ocupacao: "Madrinha e prima da noiva", descricao: "Sempre quis usar o colar da família. Nunca deixaram." },
      { id: "s2", nome: "Marcelo", idade: 31, ocupacao: "Fotógrafo do casamento", descricao: "Andou por todo o salão a noite inteira, inclusive pelo camarim." },
      { id: "s3", nome: "Dona Cida", idade: 61, ocupacao: "Mãe do noivo", descricao: "Foi contra o casamento desde o começo." },
      { id: "s4", nome: "Juninho", idade: 26, ocupacao: "DJ da festa", descricao: "Animado e falante. Comenta que vai comprar uma mesa de som nova." },
      { id: "s5", nome: "Rogério", idade: 45, ocupacao: "Gerente do salão", descricao: "Conhece cada tomada e cada porta do salão." }
    ],
    metodos: [
      { id: "m1", nome: "Apagou a luz e pegou o colar do porta-joias" },
      { id: "m2", nome: "Tirou do pescoço da noiva durante a dança" },
      { id: "m3", nome: "Trocou por uma bijuteria parecida no camarim" },
      { id: "m4", nome: "Escondeu numa marmita de bolo" }
    ],
    motivos: [
      { id: "o1", nome: "Pagar uma dívida" },
      { id: "o2", nome: "Inveja da noiva" },
      { id: "o3", nome: "Tentar acabar com o casamento" },
      { id: "o4", nome: "Vender para um antiquário" }
    ],
    solucao: {
      culpado: "s4", metodo: "m1", motivo: "o1",
      explicacao: "Juninho devia R$ 12 mil a um agiota e o prazo vencia na sexta. O quadro de luz fica atrás de uma cortina, ao lado da cabine do DJ. Às 23h05, com todo mundo na pista, ele desligou o disjuntor geral, foi até o camarim no escuro, pegou o colar do porta-joias e voltou para a cabine. Guardou o colar numa caixinha de veludo na mochila e religou a luz."
    },
    locais: [
      { id: "l1", nome: "Camarim da noiva", icone: "💄", pistas: [
        "O porta-joias está aberto e vazio. O fecho não foi forçado: estava só encostado.",
        "No espelho, um bilhete da noiva: \"Tirei o colar pra dançar. Deixei no porta-joias às 22h50.\""
      ]},
      { id: "l2", nome: "Quadro de luz", icone: "⚡", pistas: [
        "O disjuntor geral não queimou: foi desligado com a mão. Ele fica atrás de uma cortina, colado à cabine do DJ.",
        "No chão, perto do quadro de luz, uma palheta com o adesivo \"DJ Juninho\"."
      ]},
      { id: "l3", nome: "Pista de dança", icone: "💃", pistas: [
        "Durante o apagão, quase todos os convidados estavam na pista dançando.",
        "As fotos mostram a noiva dançando sem o colar desde as 22h55. Ninguém tirou nada do pescoço dela."
      ]},
      { id: "l4", nome: "Mesa do bolo", icone: "🎂", pistas: [
        "O bolo está inteiro. Só falta a fatia que os noivos cortaram juntos.",
        "As marmitas de bolo foram fechadas pela equipe do bufê, uma por uma, na frente dos convidados."
      ]},
      { id: "l5", nome: "Cabine do DJ", icone: "🎧", pistas: [
        "Na mochila do DJ, uma caixinha de veludo vazia, do tamanho de um colar.",
        "Num caderno de anotações: \"devo 12 mil pro Neném — prazo sexta\"."
      ]}
    ],
    depoimentos: {
      s1: [
        "“Ajudei a Gabi a tirar o colar às 22h50. Ela guardou no porta-joias, eu vi.”",
        "“Na hora do apagão eu estava dançando com o Rogério. Ele pode confirmar.”"
      ],
      s2: [
        "“Quando a luz apagou, usei o flash da câmera para iluminar a pista.”",
        "“Tenho foto de quase todo mundo na pista durante o apagão. Só não aparece quem estava fora dela.”"
      ],
      s3: [
        "“Não queria esse casamento, todo mundo sabe. Mas mexer em joia de noiva dá azar. Eu jamais tocaria nisso.”",
        "“Um pouco antes do apagão, vi o DJ saindo da cabine e indo para o lado da cortina.”"
      ],
      s4: [
        "“A luz caiu sozinha, esse salão é velho. Fiquei o tempo todo na cabine protegendo o equipamento.”",
        "“Estou bem de vida. Vou até comprar uma mesa de som nova.”"
      ],
      s5: [
        "“O salão foi revisado no mês passado. Disjuntor não desliga sozinho.”",
        "“Dancei com a madrinha durante o apagão inteiro. Ela não saiu do meu lado.”"
      ]
    },
    dossies: {
      perito: "PERÍCIA: o disjuntor tem marcas de dedo frescas. Ninguém da equipe do salão mexeu nele hoje.",
      investigador: "CELULAR DE JUNINHO: mensagem de \"Neném\" às 21h: \"Sexta é o prazo. Ou paga ou já sabe.\"",
      escrivao: "HORÁRIOS: colar guardado às 22h50. Apagão das 23h05 às 23h09. Sumiço percebido às 23h30.",
      arquivista: "ANTIQUÁRIOS: nenhuma joia parecida foi oferecida nos antiquários da cidade nos últimos meses.",
      fotografo: "FOTO DO APAGÃO (flash das 23h06): a cabine do DJ aparece vazia.",
      analista: "BANCO: Juninho está com o nome sujo e tem três empréstimos atrasados."
    },
    novidades: {
      2: "O eletricista do salão confirmou: o disjuntor foi desligado com a mão. O apagão foi de propósito.",
      3: "Uma loja de penhores ligou: hoje cedo, um rapaz de boné tentou penhorar um colar de esmeraldas e fugiu quando pediram documento."
    },
    falsas: [
      { texto: "Embaixo da poltrona do camarim, um brinco de Bruna que ela disse ter perdido na pista.", origem: "Camarim da noiva" },
      { texto: "Numa foto do apagão, Dona Cida aparece de costas, indo para o camarim.", origem: "Pista de dança" },
      { texto: "Uma das marmitas de bolo foi aberta e fechada de novo com fita diferente.", origem: "Mesa do bolo" },
      { texto: "Na bolsa da câmera de Marcelo, uma lupa de joalheiro.", origem: "Cabine do DJ" }
    ]
  },

  /* ------------------------------------------------------ */
  {
    id: "regata",
    titulo: "Naufrágio na Regata",
    subtitulo: "Festa do Rio · beira do São Francisco",
    dificuldade: "Fácil",
    capa: "🛶",
    intro: [
      "Na Festa do Rio, a regata de barcos a remo é o evento mais esperado. O favorito era o Surubim de Ouro, de Seu Aristeu, campeão dos últimos dois anos.",
      "Às 8h, foi dada a largada. Cinco minutos depois, o Surubim de Ouro afundou no meio do rio, com a tripulação inteira pulando na água.",
      "Ninguém se machucou, mas a festa virou confusão. Alguém sabotou o barco. Descubram quem, como e por quê."
    ],
    vitima: "O barco Surubim de Ouro, favorito da regata",
    suspeitos: [
      { id: "s1", nome: "Zé Piranha", idade: 50, ocupacao: "Pescador e remador rival", descricao: "Perdeu as duas últimas regatas para o Surubim. Pavio curto." },
      { id: "s2", nome: "Lorena", idade: 28, ocupacao: "Filha de Seu Aristeu", descricao: "Quer que o pai venda o barco e se aposente." },
      { id: "s3", nome: "Mestre Dito", idade: 70, ocupacao: "Carpinteiro de barcos", descricao: "Consertou o casco do Surubim na semana passada." },
      { id: "s4", nome: "Ivan", idade: 40, ocupacao: "Apostador", descricao: "Não perde um bolão. Diz que aposta só por diversão." },
      { id: "s5", nome: "Neide", idade: 44, ocupacao: "Dona do bar e do bolão", descricao: "Organiza a festa e cuida das apostas da regata." }
    ],
    metodos: [
      { id: "m1", nome: "Furou o casco com uma broca" },
      { id: "m2", nome: "Tirou o tampão do fundo do barco" },
      { id: "m3", nome: "Serrou o leme" },
      { id: "m4", nome: "Encheu o barco de água na garagem" }
    ],
    motivos: [
      { id: "o1", nome: "Ganhar dinheiro no bolão" },
      { id: "o2", nome: "Rivalidade antiga" },
      { id: "o3", nome: "Fazer o pai vender o barco" },
      { id: "o4", nome: "Vingança por pagamento atrasado" }
    ],
    solucao: {
      culpado: "s4", metodo: "m2", motivo: "o1",
      explicacao: "Às 6h50, Ivan apostou R$ 3 mil contra o Surubim de Ouro. O barco ficou sozinho no cais das 7h às 8h. Às 7h35, Ivan entrou na água até o joelho, puxou o tampão de borracha do fundo do barco e o soltou no rio. Com o casco furado, o Surubim afundou logo depois da largada. Na pressa, Ivan perdeu um chinelo azul entre as tábuas do cais."
    },
    locais: [
      { id: "l1", nome: "Casco do barco", icone: "🛶", pistas: [
        "O casco não tem furo nem rachadura. A água entrou pelo buraco do tampão do fundo.",
        "O leme está inteiro e funcionando."
      ]},
      { id: "l2", nome: "Garagem de barcos", icone: "🏚️", pistas: [
        "O barco passou a noite trancado na garagem. O cadeado estava inteiro de manhã.",
        "Às 7h, o barco foi levado ao cais e ficou lá sozinho até a largada, às 8h."
      ]},
      { id: "l3", nome: "Cais", icone: "🌊", pistas: [
        "Pegadas de pé molhado vão até a beirada onde o barco ficou amarrado.",
        "Entre as tábuas do cais, um chinelo de dedo azul, número 42."
      ]},
      { id: "l4", nome: "Barraca do bolão", icone: "🎟️", pistas: [
        "No caderno do bolão, uma aposta alta: R$ 3 mil contra o Surubim de Ouro, feita às 6h50.",
        "A aposta foi assinada por Ivan."
      ]},
      { id: "l5", nome: "Oficina do Mestre Dito", icone: "🔨", pistas: [
        "O recibo do conserto do casco está pago, com data da semana passada.",
        "As ferramentas de furar estão empoeiradas. Ninguém usou há dias."
      ]}
    ],
    depoimentos: {
      s1: [
        "“Rivalidade é na água. Eu queria ganhar dele na remada, não assim.”",
        "“Às 7h eu estava pescando na outra margem. Os meninos da canoa me viram.”"
      ],
      s2: [
        "“Meu pai não vende aquele barco por nada. Eu já desisti de pedir.”",
        "“Às 7h40 vi um homem de bermuda molhada saindo do cais com pressa, mancando de um pé.”"
      ],
      s3: [
        "“Fiz o serviço e recebi direitinho. O casco estava firme.”",
        "“O tampão do fundo não sai sozinho. Alguém tem que puxar com força.”"
      ],
      s4: [
        "“Aposto por diversão, nunca muito.”",
        "“Passei a manhã toda na barraca do bolão. Nem cheguei perto do cais.”"
      ],
      s5: [
        "“Teve uma aposta alta contra o favorito, achei estranho na hora.”",
        "“O Ivan chegou na barraca às 7h40 com a bermuda molhada até o joelho e um pé descalço.”"
      ]
    },
    dossies: {
      perito: "LAUDO DO BARCO: o casco está perfeito. O barco afundou porque estava sem o tampão do fundo.",
      investigador: "CELULAR DE IVAN: mensagem enviada a um amigo às 6h: \"Se o Surubim afundar, a gente fica rico.\"",
      escrivao: "HORÁRIOS: barco no cais às 7h. Largada às 8h. Naufrágio às 8h05.",
      arquivista: "SEGURO: o Surubim de Ouro não tem seguro. Ninguém da família ganha nada com o naufrágio.",
      fotografo: "FOTO DO CAIS (7h35): um homem de bermuda e chinelo azul agachado perto do barco, de costas.",
      analista: "BOLÃO: se o favorito perdesse, quem apostou contra ganharia cerca de R$ 15 mil."
    },
    novidades: {
      2: "Os pescadores acharam o tampão de borracha boiando, inteiro. Não quebrou: alguém o tirou com a mão.",
      3: "Por dentro do chinelo azul encontrado no cais, um nome escrito à caneta, meio apagado: \"I...\"."
    },
    falsas: [
      { texto: "Há marcas de broca no casco, perto da popa.", origem: "Casco do barco" },
      { texto: "O cadeado da garagem tem arranhões de chave falsa.", origem: "Garagem de barcos" },
      { texto: "Mestre Dito ainda não recebeu pelo conserto e cobrou Seu Aristeu ontem.", origem: "Oficina do Mestre Dito" },
      { texto: "Uma testemunha viu Zé Piranha amarrando o barco no cais às 7h30.", origem: "Cais" }
    ]
  },

  /* ------------------------------------------------------ */
  {
    id: "prova",
    titulo: "A Prova Vazada",
    subtitulo: "Escola Estadual Monte Verde · semana de provas",
    dificuldade: "Fácil",
    capa: "📝",
    intro: [
      "Na Escola Estadual Monte Verde, a prova final de matemática decide quem passa de ano. O professor Arnaldo preparou tudo em segredo.",
      "Às 20h da véspera, um número desconhecido começou a vender o gabarito completo num grupo de alunos, por R$ 50.",
      "A prova foi cancelada e a escola quer respostas. Quem vazou o gabarito, como conseguiu e por quê?"
    ],
    vitima: "O gabarito da prova final de matemática",
    suspeitos: [
      { id: "s1", nome: "Prof. Arnaldo", idade: 58, ocupacao: "Professor de matemática", descricao: "Exigente. Fez a prova sozinho e guardou as cópias." },
      { id: "s2", nome: "Dona Telma", idade: 49, ocupacao: "Secretária da escola", descricao: "Recebeu e contou as cópias da prova." },
      { id: "s3", nome: "Pedro", idade: 18, ocupacao: "Aluno do 3º ano", descricao: "Repetiu de ano uma vez. Se reprovar de novo, perde o emprego de aprendiz." },
      { id: "s4", nome: "Seu Lindomar", idade: 55, ocupacao: "Zelador", descricao: "Tem a chave de quase todas as salas da escola." },
      { id: "s5", nome: "Kátia", idade: 36, ocupacao: "Dona da copiadora em frente à escola", descricao: "Imprime todas as provas da escola há anos." }
    ],
    metodos: [
      { id: "m1", nome: "Fotografou a prova no armário dos professores" },
      { id: "m2", nome: "Imprimiu uma cópia a mais na copiadora" },
      { id: "m3", nome: "Invadiu o e-mail do professor" },
      { id: "m4", nome: "Achou um rascunho no lixo da escola" }
    ],
    motivos: [
      { id: "o1", nome: "Vender o gabarito aos alunos" },
      { id: "o2", nome: "Vingança contra o professor" },
      { id: "o3", nome: "Passar de ano" },
      { id: "o4", nome: "Ajudar um parente" }
    ],
    solucao: {
      culpado: "s5", metodo: "m2", motivo: "o1",
      explicacao: "O professor mandou o arquivo da prova só para a copiadora. Kátia imprimiu 121 cópias, entregou 120 e guardou uma. À noite, resolveu a prova, montou o gabarito e vendeu pelo grupo dos alunos, com uma chave PIX ligada à copiadora. Recebeu 23 pagamentos antes de a escola descobrir."
    },
    locais: [
      { id: "l1", nome: "Sala dos professores", icone: "🏫", pistas: [
        "O armário das provas está trancado e sem nenhuma marca de arrombamento.",
        "As provas foram contadas de novo: estão lá as 120 cópias, nenhuma faltando."
      ]},
      { id: "l2", nome: "Copiadora em frente", icone: "🖨️", pistas: [
        "O contador da máquina marca 121 cópias no serviço da escola. A nota fiscal diz 120.",
        "Na bandeja da máquina ficou uma folha de teste com o cabeçalho da prova de matemática."
      ]},
      { id: "l3", nome: "Celular apreendido", icone: "📱", pistas: [
        "No grupo dos alunos, o gabarito foi oferecido às 20h por R$ 50, de um número sem foto.",
        "O número desconhecido mandou uma chave PIX: um CNPJ, não um CPF."
      ]},
      { id: "l4", nome: "Lixeira da escola", icone: "🗑️", pistas: [
        "Na lixeira só há rascunhos de redação. Nada da prova de matemática.",
        "O zelador esvazia a lixeira todos os dias às 17h. Ontem também."
      ]},
      { id: "l5", nome: "Computador do professor", icone: "💻", pistas: [
        "O e-mail do professor não teve nenhum acesso estranho. A senha não foi trocada.",
        "O arquivo da prova foi enviado uma única vez, ontem às 14h, para o e-mail da copiadora."
      ]}
    ],
    depoimentos: {
      s1: [
        "“Fiz a prova sozinho, mandei para a copiadora e guardei as cópias no armário.”",
        "“O Pedro disse que eu ia me arrepender se ele reprovasse de novo.”"
      ],
      s2: [
        "“Contei as cópias quando chegaram: 120 certinho.”",
        "“A copiadora sempre imprime uma cópia a mais \"pra testar a máquina\". Já reclamei disso.”"
      ],
      s3: [
        "“Eu preciso passar, mas eu ia estudar. Nem dinheiro pra comprar gabarito eu tenho.”",
        "“Recebi a mensagem oferecendo o gabarito. Não comprei, juro.”"
      ],
      s4: [
        "“Esvaziei a lixeira às 17h, como sempre. Não tinha nada de prova.”",
        "“Às 13h50 a dona da copiadora veio perguntar se a prova de matemática ia mesmo cair amanhã.”"
      ],
      s5: [
        "“Imprimi 120 e entreguei 120. Não sobra nada.”",
        "“A máquina não guarda arquivo. Não tem como alguém copiar lá.”"
      ]
    },
    dossies: {
      perito: "PERÍCIA: a folha usada para fazer o gabarito tem uma mancha de tinta igual à que a máquina da copiadora deixa no canto.",
      investigador: "CELULAR APREENDIDO: o número que vendeu o gabarito é um chip pré-pago comprado anteontem.",
      escrivao: "HORÁRIOS: prova enviada às 14h. Cópias entregues às 17h30. Gabarito à venda às 20h.",
      arquivista: "RECEITA FEDERAL: o CNPJ da chave PIX é da Copiadora Monte Verde.",
      fotografo: "FOTO DA COPIADORA (18h): as luzes acesas e uma pessoa de avental sentada com uma folha e uma calculadora.",
      analista: "BANCO: a chave PIX recebeu 23 pagamentos de R$ 50 entre 20h e 23h."
    },
    novidades: {
      2: "O professor confirmou: o gabarito vazado tem até o erro de digitação da questão 7, que só existe na versão impressa.",
      3: "O banco informou: a chave PIX usada para vender o gabarito é de uma empresa que fica na rua da escola."
    },
    falsas: [
      { texto: "A fechadura do armário tem marcas de chave de fenda.", origem: "Sala dos professores" },
      { texto: "No lixo havia um rascunho do gabarito com a letra de Pedro.", origem: "Lixeira da escola" },
      { texto: "O e-mail do professor foi aberto às 2h da manhã de um celular desconhecido.", origem: "Computador do professor" },
      { texto: "Dona Telma levou uma cópia da prova para casa dentro da bolsa.", origem: "Copiadora em frente" }
    ]
  }
);
