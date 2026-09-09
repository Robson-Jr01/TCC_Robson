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
    const item = filaDeNotificacoes.shift(); // O(1) - remove o primeiro
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

app.use(cors());
app.use(express.json());

// Rota de teste - confirma que a API está no ar
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
    res.status(400).json({ erro: "Não foi possível cadastrar o artista", detalhes: error });
  }
});

// Cadastra um novo publicador (prefeitura ou empresa)
app.post("/publicadores", async (req, res) => {
  try {
    const { nome, tipo, email, senha, cidade_id } = req.body;

    const senha_hash = await bcrypt.hash(senha, 10);

    const publicador = await prisma.publicadores.create({
      data: {
        nome,
        tipo,
        email,
        senha_hash,
        cidade_id,
      },
    });

    res.status(201).json(publicador);
  } catch (error) {
    res.status(400).json({ erro: "Não foi possível cadastrar o publicador", detalhes: error });
  }
});

// Publica um novo edital
app.post("/editais", async (req, res) => {
  try {
    const {
      publicador_id,
      titulo,
      categoria_id,
      especialidade_id,
      cidade_ids, // agora é uma lista: [1, 3, 5]
      descricao,
      premio,
      prazo_inscricao,
      exige_documentos,
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
        vagas: vagas ?? null,
        edital_cidades: {
          create: (cidade_ids || []).map((id: number) => ({ cidade_id: id })),
        },
      },
      include: { edital_cidades: true },
    });

    res.status(201).json(edital);
  } catch (error) {
    res.status(400).json({ erro: "Não foi possível publicar o edital", detalhes: error });
  }
});

// Login (artista ou publicador)
app.post("/login", async (req, res) => {
  try {
    const { email, senha, tipo } = req.body; // tipo: "artista" ou "publicador"

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
    res.status(400).json({ erro: "Não foi possível fazer login", detalhes: error });
  }
});

// Inscreve um artista em um edital
app.post("/inscricoes", async (req, res) => {
  try {
    const { edital_id, artista_id, documentos_url } = req.body;

    const inscricao = await prisma.inscricoes.create({
      data: { edital_id, artista_id, documentos_url },
    });

    res.status(201).json(inscricao);
  } catch (error) {
    res.status(400).json({ erro: "Não foi possível se inscrever", detalhes: error });
  }
});

// Acha artistas compatíveis com um edital e enfileira as notificações
app.post("/editais/:id/notificar", async (req, res) => {
  try {
    const editalId = Number(req.params.id);

    const edital = await prisma.editais.findUnique({ where: { id: editalId } });
    if (!edital) {
      return res.status(404).json({ erro: "Edital não encontrado" });
    }

    // Busca todas as cidades vinculadas a esse edital
    const cidadesDoEdital = await prisma.edital_cidades.findMany({
      where: { edital_id: editalId },
      select: { cidade_id: true },
    });
    const idsCidades = cidadesDoEdital.map((c) => c.cidade_id);

    // Interseção: artistas cuja especialidade bate E cuja cidade está entre as do edital
    const artistasCompativeis = await prisma.artistas.findMany({
      where: {
        artista_especialidades: edital.especialidade_id
          ? { some: { especialidade_id: edital.especialidade_id } }
          : undefined,
        artista_cidades: { some: { cidade_id: { in: idsCidades } } },
      },
    });

    // Enfileira uma notificação pra cada artista compatível
    for (const artista of artistasCompativeis) {
      enfileirar({
        artistaId: artista.id,
        editalId: edital.id,
        mensagem: `Novo edital compatível com seu perfil: ${edital.titulo}`,
      });
    }

    processarFila(); // roda em segundo plano, sem travar a resposta

    res.json({
      mensagem: `${artistasCompativeis.length} artista(s) notificado(s)`,
      artistas: artistasCompativeis.map((a) => ({ id: a.id, nome: a.nome })),
    });
  } catch (error) {
    res.status(400).json({ erro: "Não foi possível processar as notificações", detalhes: error });
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
    res.status(400).json({ erro: "Não foi possível listar os editais", detalhes: error });
  }
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

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});