import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const app = express();
const prisma = new PrismaClient();

// Fila de notificações (estrutura FIFO simples, em memória)
type ItemFila = { artistaId: number; editalId: number; mensagem: string };
const filaDeNotificacoes: ItemFila[] = [];

function enfileirar(item: ItemFila) {
  filaDeNotificacoes.push(item); // O(1)
}

// Consumidor: drena a fila inteira, na ordem de chegada (FIFO)
async function processarFila() {
  while (filaDeNotificacoes.length > 0) {
    const item = filaDeNotificacoes.shift();
    if (!item) break;
    await prisma.notificacoes.create({
      data: {
        artista_id: item.artistaId,
        edital_id: item.editalId,
        mensagem: item.mensagem,
      },
    });
  }
}

// Acha os artistas compatíveis com um edital e enfileira um aviso para cada um
async function notificarArtistasCompativeis(editalId: number) {
  const edital = await prisma.editais.findUnique({
    where: { id: editalId },
    include: { edital_cidades: true },
  });
  if (!edital) return null;

  const idsCidades = edital.edital_cidades.map((c) => c.cidade_id);

  const artistas = await prisma.artistas.findMany({
    where: {
      artista_cidades: { some: { cidade_id: { in: idsCidades } } },
      artista_especialidades: edital.especialidade_id
        ? { some: { especialidade_id: edital.especialidade_id } }
        : { some: { especialidades: { categoria_id: edital.categoria_id } } },
    },
  });

  for (const artista of artistas) {
    enfileirar({
      artistaId: artista.id,
      editalId: edital.id,
      mensagem: `Novo edital compatível com seu perfil: ${edital.titulo}`,
    });
  }

  processarFila(); // roda em segundo plano, sem travar a resposta

  return artistas;
}

app.use(cors());
app.use(express.json());

// Rota de teste, confirma que a API está no ar
app.get("/", (req, res) => {
  res.json({ status: "API do PECAC funcionando!" });
});

// Lista todas as especialidades cadastradas, com a categoria de cada uma
app.get("/especialidades", async (req, res) => {
  const especialidades = await prisma.especialidades.findMany({
    include: { categorias: true },
  });
  res.json(especialidades);
});

// Lista categorias, cada uma já trazendo suas especialidades
app.get("/categorias", async (req, res) => {
  const categorias = await prisma.categorias.findMany({
    include: { especialidades: true },
  });
  res.json(categorias);
});

// Lista todas as cidades
app.get("/cidades", async (req, res) => {
  const cidades = await prisma.cidades.findMany();
  res.json(cidades);
});

// Cadastra um novo artista
app.post("/artistas", async (req, res) => {
  try {
    const {
      nome,
      email,
      senha,
      tempo_carreira,
      curriculo,
      portfolio_url,
      redes_sociais,
      especialidade_ids,
      cidade_ids,
    } = req.body;

    const senha_hash = await bcrypt.hash(senha, 10);

    const artista = await prisma.artistas.create({
      data: {
        nome,
        email,
        senha_hash,
        tempo_carreira,
        curriculo,
        portfolio_url,
        artista_redes_sociais: {
          create: redes_sociais || [],
        },
        artista_especialidades: {
          create: (especialidade_ids || []).map((id: number) => ({ especialidade_id: id })),
        },
        artista_cidades: {
          create: (cidade_ids || []).map((id: number) => ({ cidade_id: id })),
        },
      },
      include: {
        artista_redes_sociais: true,
        artista_especialidades: true,
        artista_cidades: true,
      },
    });

    res.status(201).json(artista);
  } catch (error) {
    console.error(error);
    res.status(400).json({ erro: "Não foi possível cadastrar o artista", detalhes: String(error) });
  }
});

// Cadastra um novo publicador (prefeitura ou empresa)
app.post("/publicadores", async (req, res) => {
  try {
    const { nome, tipo, email, senha, cidade_id } = req.body;

    const senha_hash = await bcrypt.hash(senha, 10);

    const publicador = await prisma.publicadores.create({
      data: { nome, tipo, email, senha_hash, cidade_id },
    });

    res.status(201).json(publicador);
  } catch (error) {
    console.error(error);
    res.status(400).json({ erro: "Não foi possível cadastrar o publicador", detalhes: String(error) });
  }
});

// Login (artista ou publicador)
app.post("/login", async (req, res) => {
  try {
    const { email, senha, tipo } = req.body;

    const usuario =
      tipo === "artista"
        ? await prisma.artistas.findUnique({ where: { email } })
        : await prisma.publicadores.findUnique({ where: { email } });

    if (!usuario) {
      return res.status(401).json({ erro: "Email ou senha inválidos" });
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaCorreta) {
      return res.status(401).json({ erro: "Email ou senha inválidos" });
    }

    const token = jwt.sign(
      { id: usuario.id, tipo },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email } });
  } catch (error) {
    console.error(error);
    res.status(400).json({ erro: "Não foi possível fazer login", detalhes: String(error) });
  }
});

// Publica um novo edital e avisa os artistas compatíveis
app.post("/editais", async (req, res) => {
  try {
    const {
      publicador_id,
      titulo,
      categoria_id,
      especialidade_id,
      cidade_ids,
      descricao,
      premio,
      prazo_inscricao,
      exige_documentos,
      instrucoes_documentos,
      vagas,
    } = req.body;

    const edital = await prisma.editais.create({
      data: {
        publicador_id,
        titulo,
        categoria_id,
        especialidade_id,
        descricao,
        premio,
        prazo_inscricao: new Date(prazo_inscricao),
        exige_documentos: exige_documentos ?? false,
        instrucoes_documentos: exige_documentos ? instrucoes_documentos : null,
        vagas: vagas ?? null,
        edital_cidades: {
          create: (cidade_ids || []).map((id: number) => ({ cidade_id: id })),
        },
      },
      include: { edital_cidades: true },
    });

    res.status(201).json(edital);

    // Avisa os artistas em segundo plano, a resposta ao publicador não espera
    notificarArtistasCompativeis(edital.id).catch(console.error);
  } catch (error) {
    console.error(error);
    res.status(400).json({ erro: "Não foi possível publicar o edital", detalhes: String(error) });
  }
});

// Busca um edital específico, com todos os detalhes
app.get("/editais/:id", async (req, res) => {
  try {
    const editalId = Number(req.params.id);
    const edital = await prisma.editais.findUnique({
      where: { id: editalId },
      include: {
        categorias: true,
        especialidades: true,
        edital_cidades: { include: { cidades: true } },
      },
    });
    if (!edital) return res.status(404).json({ erro: "Edital não encontrado" });
    res.json(edital);
  } catch (error) {
    console.error(error);
    res.status(400).json({ erro: "Não foi possível buscar o edital", detalhes: String(error) });
  }
});

// Atualiza todos os dados de um edital (edição completa)
app.put("/editais/:id", async (req, res) => {
  try {
    const editalId = Number(req.params.id);
    const {
      titulo,
      categoria_id,
      especialidade_id,
      cidade_ids,
      descricao,
      premio,
      prazo_inscricao,
      exige_documentos,
      instrucoes_documentos,
      vagas,
    } = req.body;

    await prisma.edital_cidades.deleteMany({ where: { edital_id: editalId } });

    const edital = await prisma.editais.update({
      where: { id: editalId },
      data: {
        titulo,
        categoria_id,
        especialidade_id,
        descricao,
        premio,
        prazo_inscricao: new Date(prazo_inscricao),
        exige_documentos,
        instrucoes_documentos: exige_documentos ? instrucoes_documentos : null,
        vagas,
        edital_cidades: {
          create: (cidade_ids || []).map((id: number) => ({ cidade_id: id })),
        },
      },
      include: { edital_cidades: true },
    });

    res.json(edital);
  } catch (error) {
    console.error(error);
    res.status(400).json({ erro: "Não foi possível atualizar o edital", detalhes: String(error) });
  }
});

// Atualiza o status de um edital (ex: encerrar)
app.patch("/editais/:id/status", async (req, res) => {
  try {
    const editalId = Number(req.params.id);
    const { status } = req.body;

    const edital = await prisma.editais.update({
      where: { id: editalId },
      data: { status },
    });

    res.json(edital);
  } catch (error) {
    console.error(error);
    res.status(400).json({ erro: "Não foi possível atualizar o status", detalhes: String(error) });
  }
});

// Dispara manualmente os avisos de um edital (útil para testes)
app.post("/editais/:id/notificar", async (req, res) => {
  try {
    const artistas = await notificarArtistasCompativeis(Number(req.params.id));
    if (artistas === null) {
      return res.status(404).json({ erro: "Edital não encontrado" });
    }

    res.json({
      mensagem: `${artistas.length} artista(s) notificado(s)`,
      artistas: artistas.map((a) => ({ id: a.id, nome: a.nome })),
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ erro: "Não foi possível processar as notificações", detalhes: String(error) });
  }
});

// Lista os editais de um publicador específico, com contagem de inscrições
app.get("/publicadores/:id/editais", async (req, res) => {
  try {
    const publicadorId = Number(req.params.id);

    const editais = await prisma.editais.findMany({
      where: { publicador_id: publicadorId },
      include: {
        categorias: true,
        _count: { select: { inscricoes: true } },
      },
      orderBy: { criado_em: "desc" },
    });

    res.json(editais);
  } catch (error) {
    console.error(error);
    res.status(400).json({ erro: "Não foi possível listar os editais", detalhes: String(error) });
  }
});

// Lista as inscrições de um edital específico, com dados do artista
app.get("/editais/:id/inscricoes", async (req, res) => {
  try {
    const editalId = Number(req.params.id);

    const inscricoes = await prisma.inscricoes.findMany({
      where: { edital_id: editalId },
      include: {
        artistas: {
          select: { id: true, nome: true, curriculo: true, portfolio_url: true },
        },
      },
      orderBy: { inscrito_em: "asc" },
    });

    res.json(inscricoes);
  } catch (error) {
    console.error(error);
    res.status(400).json({ erro: "Não foi possível listar as inscrições", detalhes: String(error) });
  }
});

// Inscreve um artista em um edital
app.post("/inscricoes", async (req, res) => {
  try {
    const { edital_id, artista_id, documentos_url } = req.body;

    const edital = await prisma.editais.findUnique({ where: { id: edital_id } });
    if (!edital) return res.status(404).json({ erro: "Edital não encontrado" });
    if (edital.status !== "aberto") {
      return res.status(400).json({ erro: "Este edital não está aberto para inscrições" });
    }
      
    const agora = new Date();
    const hoje = new Date(Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate()));
    if (edital.prazo_inscricao.getTime() < hoje.getTime()) {
      return res.status(400).json({ erro: "O prazo de inscrição deste edital já terminou" });
    }

    if (edital.vagas !== null) {
      const total = await prisma.inscricoes.count({ where: { edital_id } });
      if (total >= edital.vagas) {
        return res.status(400).json({ erro: "Vagas esgotadas para este edital" });
      }
    }

    const jaInscrito = await prisma.inscricoes.findFirst({ where: { edital_id, artista_id } });
    if (jaInscrito) return res.status(400).json({ erro: "Você já está inscrito neste edital" });

    const inscricao = await prisma.inscricoes.create({
      data: { edital_id, artista_id, documentos_url },
    });

    enfileirar({
      artistaId: artista_id,
      editalId: edital_id,
      mensagem: `Inscrição confirmada: ${edital.titulo}`,
    });
    processarFila();

    res.status(201).json(inscricao);
  } catch (error) {
    console.error(error);
    res.status(400).json({ erro: "Não foi possível se inscrever", detalhes: String(error) });
  }
});

// Atualiza o status de uma inscrição (selecionar ou rejeitar) e avisa o artista
app.patch("/inscricoes/:id/status", async (req, res) => {
  try {
    const inscricaoId = Number(req.params.id);
    const { status } = req.body;

    const inscricao = await prisma.inscricoes.update({
      where: { id: inscricaoId },
      data: { status },
      include: { editais: { select: { titulo: true } } },
    });

    if (status === "selecionado" || status === "nao_selecionado") {
      enfileirar({
        artistaId: inscricao.artista_id,
        editalId: inscricao.edital_id,
        mensagem:
          status === "selecionado"
            ? `Você foi selecionado no edital: ${inscricao.editais.titulo}`
            : `Resultado disponível para o edital: ${inscricao.editais.titulo}`,
      });
      processarFila();
    }

    res.json(inscricao);
  } catch (error) {
    console.error(error);
    res.status(400).json({ erro: "Não foi possível atualizar a inscrição", detalhes: String(error) });
  }
});

// Editais abertos compatíveis com o perfil de um artista
app.get("/artistas/:id/editais-compativeis", async (req, res) => {
  try {
    const artistaId = Number(req.params.id);

    const artista = await prisma.artistas.findUnique({
      where: { id: artistaId },
      include: {
        artista_especialidades: { include: { especialidades: true } },
        artista_cidades: true,
      },
    });
    if (!artista) return res.status(404).json({ erro: "Artista não encontrado" });

    const especialidadeIds = artista.artista_especialidades.map((ae) => ae.especialidade_id);
    const categoriaIds = artista.artista_especialidades.map((ae) => ae.especialidades.categoria_id);
    const cidadeIds = artista.artista_cidades.map((ac) => ac.cidade_id);

        const agora = new Date();
    const hoje = new Date(Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate()));

    const editais = await prisma.editais.findMany({
      where: {
        status: "aberto",
        prazo_inscricao: { gte: hoje },
        edital_cidades: { some: { cidade_id: { in: cidadeIds } } },
        OR: [
          { especialidade_id: { in: especialidadeIds } },
          { especialidade_id: null, categoria_id: { in: categoriaIds } },
        ],
      },
      include: {
        categorias: true,
        edital_cidades: { include: { cidades: true } },
        inscricoes: { where: { artista_id: artistaId }, select: { id: true } },
      },
      orderBy: { prazo_inscricao: "asc" },
    });

    res.json(
      editais.map(({ inscricoes, ...edital }) => ({ ...edital, ja_inscrito: inscricoes.length > 0 }))
    );
  } catch (error) {
    console.error(error);
    res.status(400).json({ erro: "Não foi possível listar os editais", detalhes: String(error) });
  }
});

// Lista as notificações de um artista (mais recentes primeiro)
app.get("/artistas/:id/notificacoes", async (req, res) => {
  try {
    const artistaId = Number(req.params.id);

    const notificacoes = await prisma.notificacoes.findMany({
      where: { artista_id: artistaId },
      orderBy: { criado_em: "desc" },
      take: 50,
    });

    res.json(notificacoes);
  } catch (error) {
    console.error(error);
    res.status(400).json({ erro: "Não foi possível listar as notificações", detalhes: String(error) });
  }
});

// Marca todas as notificações de um artista como lidas
app.patch("/artistas/:id/notificacoes/lidas", async (req, res) => {
  try {
    const artistaId = Number(req.params.id);

    await prisma.notificacoes.updateMany({
      where: { artista_id: artistaId, lida: false },
      data: { lida: true },
    });

    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(400).json({ erro: "Não foi possível marcar como lidas", detalhes: String(error) });
  }
});

// Lista as inscrições de um artista, com os dados de cada edital
app.get("/artistas/:id/inscricoes", async (req, res) => {
  try {
    const artistaId = Number(req.params.id);

    const inscricoes = await prisma.inscricoes.findMany({
      where: { artista_id: artistaId },
      include: {
        editais: {
          include: {
            categorias: true,
            edital_cidades: { include: { cidades: true } },
          },
        },
      },
      orderBy: { inscrito_em: "desc" },
    });

    res.json(inscricoes);
  } catch (error) {
    console.error(error);
    res.status(400).json({ erro: "Não foi possível listar as inscrições", detalhes: String(error) });
  }
});

// Detalhes de um edital do ponto de vista de um artista (inclui a inscrição dele, se houver)
app.get("/artistas/:artistaId/editais/:editalId", async (req, res) => {
  try {
    const artistaId = Number(req.params.artistaId);
    const editalId = Number(req.params.editalId);

    const edital = await prisma.editais.findUnique({
      where: { id: editalId },
      include: {
        categorias: true,
        especialidades: true,
        publicadores: { select: { nome: true } },
        edital_cidades: { include: { cidades: true } },
        inscricoes: { where: { artista_id: artistaId }, select: { id: true, status: true } },
        _count: { select: { inscricoes: true } },
      },
    });
    if (!edital) return res.status(404).json({ erro: "Edital não encontrado" });

    const { inscricoes, ...resto } = edital;
    res.json({ ...resto, inscricao: inscricoes[0] ?? null });
  } catch (error) {
    console.error(error);
    res.status(400).json({ erro: "Não foi possível buscar o edital", detalhes: String(error) });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});