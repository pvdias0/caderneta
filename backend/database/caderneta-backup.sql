--
--
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
--
--
CREATE FUNCTION public.ajuste_saldo_conta(p_id_conta bigint, p_delta numeric) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Se a conta não existe, apenas retorna (já foi deletada em CASCADE)
    IF NOT EXISTS(SELECT 1 FROM conta WHERE id_conta = p_id_conta) THEN
        RETURN;
    END IF;
    -- Atualizar o saldo
    UPDATE conta
    SET saldo_devedor = saldo_devedor + p_delta,
        ultimaatualizacao = NOW()
    WHERE id_conta = p_id_conta;
END;
$$;
--
--
CREATE FUNCTION public.atualizar_timestamp_cliente() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.UltimaAtualizacao = NOW();
    RETURN NEW;
END;
$$;
--
--
CREATE FUNCTION public.atualizar_timestamp_compra() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.UltimaAtualizacao = NOW();
    RETURN NEW;
END;
$$;
--
--
CREATE FUNCTION public.atualizar_timestamp_conta() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.UltimaAtualizacao = NOW();
    RETURN NEW;
END;
$$;
--
--
CREATE FUNCTION public.atualizar_timestamp_item_compra() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.UltimaAtualizacao = NOW();
    RETURN NEW;
END;
$$;
--
--
CREATE FUNCTION public.atualizar_timestamp_pagamento() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.UltimaAtualizacao = NOW();
    RETURN NEW;
END;
$$;
--
--
CREATE FUNCTION public.atualizar_timestamp_produto() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.UltimaAtualizacao = NOW();
    RETURN NEW;
END;
$$;
--
--
CREATE FUNCTION public.atualizar_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.ultimaatualizacao = NOW();
  RETURN NEW;
END;
$$;
--
--
CREATE FUNCTION public.fn_cria_conta_para_novo_cliente() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO Conta (ID_Cliente, Saldo_Devedor)
    VALUES (NEW.ID_Cliente, 0);
    RETURN NEW;
END;
$$;
--
--
CREATE FUNCTION public.recalc_saldo_conta(p_id_conta bigint) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    total_compra NUMERIC := 0;
    total_pagto  NUMERIC := 0;
    novo_saldo   NUMERIC := 0;
BEGIN
    SELECT COALESCE(SUM(Valor),0)
    INTO total_compra
    FROM Movimento
    WHERE ID_Conta = p_id_conta AND Tipo = 'COMPRA';
    SELECT COALESCE(SUM(Valor),0)
    INTO total_pagto
    FROM Movimento
    WHERE ID_Conta = p_id_conta AND Tipo = 'PAGAMENTO';
    novo_saldo := total_compra - total_pagto;
    UPDATE Conta
    SET Saldo_Devedor = novo_saldo,
        UltimaAtualizacao = NOW()
    WHERE ID_Conta = p_id_conta;
    RETURN novo_saldo;
END;
$$;
--
--
CREATE FUNCTION public.recalc_todas_saldos() RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT ID_Conta FROM Conta LOOP
        PERFORM recalc_saldo_conta(r.ID_Conta);
    END LOOP;
END;
$$;
--
--
CREATE FUNCTION public.trg_compra_after_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Ao deletar uma compra, subtrai-se o valor (reverte a adição anterior)
    PERFORM ajuste_saldo_conta(OLD.ID_Conta, - OLD.Valor_Compra);
    RETURN OLD;
END;
$$;
--
--
CREATE FUNCTION public.trg_compra_after_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM ajuste_saldo_conta(NEW.ID_Conta, NEW.Valor_Compra);
    RETURN NEW;
END;
$$;
--
--
CREATE FUNCTION public.trg_compra_after_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    delta NUMERIC;
BEGIN
    -- Se mudou apenas o Valor_Compra, aplica delta na mesma conta
    -- Se mudou de conta (ID_Conta), reverte o antigo e aplica o novo
    IF (NEW.ID_Conta = OLD.ID_Conta) THEN
        delta := NEW.Valor_Compra - OLD.Valor_Compra;
        IF delta <> 0 THEN
            PERFORM ajuste_saldo_conta(NEW.ID_Conta, delta);
        END IF;
    ELSE
        -- reverter na conta antiga
        PERFORM ajuste_saldo_conta(OLD.ID_Conta, - OLD.Valor_Compra);
        -- aplicar na nova conta
        PERFORM ajuste_saldo_conta(NEW.ID_Conta, NEW.Valor_Compra);
    END IF;
    RETURN NEW;
END;
$$;
--
--
CREATE FUNCTION public.trg_log_compra() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO movimento (id_conta, tipo, id_compra)
  VALUES (NEW.id_conta, 'COMPRA', NEW.id_compra);
  RETURN NEW;
END;
$$;
--
--
CREATE FUNCTION public.trg_log_pagamento() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO movimento (id_conta, tipo, id_pagamento)
  VALUES (NEW.id_conta, 'PAGAMENTO', NEW.id_pagamento);
  RETURN NEW;
END;
$$;
--
--
CREATE FUNCTION public.trg_pagamento_after_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM ajuste_saldo_conta(OLD.id_conta, OLD.valor_pagamento);
    RETURN OLD;
END;
$$;
--
--
CREATE FUNCTION public.trg_pagamento_after_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM ajuste_saldo_conta(NEW.id_conta, -NEW.valor_pagamento);
    RETURN NEW;
END;
$$;
--
--
CREATE FUNCTION public.trg_pagamento_after_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    delta NUMERIC;
BEGIN
    delta := -(NEW.valor_pagamento - OLD.valor_pagamento);
    IF (NEW.id_conta <> OLD.id_conta) THEN
        PERFORM ajuste_saldo_conta(OLD.id_conta, OLD.valor_pagamento);
        PERFORM ajuste_saldo_conta(NEW.id_conta, -NEW.valor_pagamento);
    ELSE
        PERFORM ajuste_saldo_conta(NEW.id_conta, delta);
    END IF;
    RETURN NEW;
END;
$$;
SET default_tablespace = '';
SET default_table_access_method = heap;
--
--
CREATE TABLE public.cliente (
    id_cliente bigint NOT NULL,
    nome character varying(120) NOT NULL,
    telefone character varying(20),
    email character varying(150),
    datacriacao timestamp with time zone DEFAULT now() NOT NULL,
    ultimaatualizacao timestamp with time zone DEFAULT now() NOT NULL,
    id_usuario integer NOT NULL
);
--
--
ALTER TABLE public.cliente ALTER COLUMN id_cliente ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.cliente_id_cliente_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
--
--
CREATE TABLE public.compra (
    id_compra bigint NOT NULL,
    id_conta bigint NOT NULL,
    valor_compra numeric(12,2) NOT NULL,
    data_compra timestamp with time zone DEFAULT now() NOT NULL,
    datacriacao timestamp with time zone DEFAULT now() NOT NULL,
    ultimaatualizacao timestamp with time zone DEFAULT now() NOT NULL,
    desconto numeric(12,2) DEFAULT 0 NOT NULL,
    CONSTRAINT compra_desconto_check CHECK ((desconto >= (0)::numeric))
);
--
--
ALTER TABLE public.compra ALTER COLUMN id_compra ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.compra_id_compra_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
--
--
CREATE TABLE public.conta (
    id_conta bigint NOT NULL,
    id_cliente bigint NOT NULL,
    saldo_devedor numeric(12,2) DEFAULT 0 NOT NULL,
    datacriacao timestamp with time zone DEFAULT now() NOT NULL,
    ultimaatualizacao timestamp with time zone DEFAULT now() NOT NULL
);
--
--
ALTER TABLE public.conta ALTER COLUMN id_conta ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.conta_id_conta_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
--
--
CREATE TABLE public.item_compra (
    id_item_compra bigint NOT NULL,
    id_compra bigint NOT NULL,
    id_produto bigint NOT NULL,
    quantidade numeric(12,3) NOT NULL,
    valor_unitario numeric(12,2) NOT NULL,
    datacriacao timestamp with time zone DEFAULT now() NOT NULL,
    ultimaatualizacao timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT item_compra_quantidade_check CHECK ((quantidade > (0)::numeric)),
    CONSTRAINT item_compra_valor_unitario_check CHECK ((valor_unitario >= (0)::numeric))
);
--
--
ALTER TABLE public.item_compra ALTER COLUMN id_item_compra ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.item_compra_id_item_compra_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
--
--
CREATE TABLE public.movimento (
    id_movimento bigint NOT NULL,
    id_conta bigint NOT NULL,
    tipo character varying(20) NOT NULL,
    id_compra bigint,
    id_pagamento bigint,
    CONSTRAINT movimento_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('COMPRA'::character varying)::text, ('PAGAMENTO'::character varying)::text, ('AJUSTE'::character varying)::text]))),
    CONSTRAINT movimento_xor CHECK (((((tipo)::text = 'COMPRA'::text) AND (id_compra IS NOT NULL) AND (id_pagamento IS NULL)) OR (((tipo)::text = 'PAGAMENTO'::text) AND (id_compra IS NULL) AND (id_pagamento IS NOT NULL)) OR (((tipo)::text = 'AJUSTE'::text) AND (id_compra IS NULL) AND (id_pagamento IS NULL))))
);
--
--
CREATE SEQUENCE public.movimento_id_movimento_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
--
--
ALTER SEQUENCE public.movimento_id_movimento_seq OWNED BY public.movimento.id_movimento;
--
--
CREATE TABLE public.pagamento (
    id_pagamento bigint NOT NULL,
    id_conta bigint NOT NULL,
    valor_pagamento numeric(12,2) NOT NULL,
    data_pagamento timestamp with time zone DEFAULT now() NOT NULL,
    datacriacao timestamp with time zone DEFAULT now() NOT NULL,
    ultimaatualizacao timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pagamento_valor_pagamento_check CHECK ((valor_pagamento > (0)::numeric))
);
--
--
ALTER TABLE public.pagamento ALTER COLUMN id_pagamento ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.pagamento_id_pagamento_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
--
--
CREATE TABLE public.produto (
    id_produto bigint NOT NULL,
    nome character varying(150) NOT NULL,
    valor_produto numeric(12,2) NOT NULL,
    quantidade_estoque numeric(12,3) NOT NULL,
    datacriacao timestamp with time zone DEFAULT now() NOT NULL,
    ultimaatualizacao timestamp with time zone DEFAULT now() NOT NULL,
    id_usuario integer NOT NULL,
    CONSTRAINT produto_quantidade_estoque_check CHECK ((quantidade_estoque >= (0)::numeric)),
    CONSTRAINT produto_valor_produto_check CHECK ((valor_produto >= (0)::numeric))
);
--
--
ALTER TABLE public.produto ALTER COLUMN id_produto ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.produto_id_produto_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
--
--
CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nome_usuario character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    senha text NOT NULL,
    datacriacao timestamp without time zone DEFAULT now() NOT NULL,
    ultimaatualizacao timestamp without time zone DEFAULT now() NOT NULL,
    reset_token character varying(255),
    reset_token_expires timestamp with time zone
);
--
--
COMMENT ON COLUMN public.usuarios.reset_token IS 'Hash do token de recupera‡Æo de senha (seguro)';
--
--
COMMENT ON COLUMN public.usuarios.reset_token_expires IS 'Timestamp de expira‡Æo do token (1 hora ap¢s gera‡Æo)';
--
--
CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
--
--
ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;
--
--
CREATE VIEW public.v_movimento_completo AS
 SELECT m.id_movimento,
    m.id_conta,
    m.tipo,
    COALESCE(c.valor_compra, p.valor_pagamento) AS valor,
    COALESCE(c.data_compra, p.data_pagamento) AS data_movimento,
    m.id_compra,
    m.id_pagamento,
    COALESCE(c.desconto, (0)::numeric) AS desconto
   FROM ((public.movimento m
     LEFT JOIN public.compra c ON ((m.id_compra = c.id_compra)))
     LEFT JOIN public.pagamento p ON ((m.id_pagamento = p.id_pagamento)));
--
--
ALTER TABLE ONLY public.movimento ALTER COLUMN id_movimento SET DEFAULT nextval('public.movimento_id_movimento_seq'::regclass);
--
--
ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);
--
--
COPY public.cliente (id_cliente, nome, telefone, email, datacriacao, ultimaatualizacao, id_usuario) FROM stdin;
9	Dina	(86) 99428-0807	\N	2025-12-14 12:38:50.538103-03	2025-12-14 12:38:50.538103-03	4
10	Teste	\N	\N	2025-12-30 14:29:07.880046-03	2025-12-30 14:29:07.880046-03	3
11	Cliente 1	(68) 97679-9790	Cliente1@example.com	2026-02-09 14:50:33.121957-03	2026-02-11 09:49:36.401774-03	5
12	Conceição	(86) 30852-870	\N	2026-04-11 20:15:28.882164-03	2026-04-11 20:15:28.882164-03	4
13	Ana Maria Miracéu	(86) 98897-3399	\N	2026-04-11 20:18:03.958479-03	2026-04-11 20:18:03.958479-03	4
14	Hernando- Miracéu	(86) 99994-5941	\N	2026-04-11 20:19:42.959505-03	2026-04-11 20:19:42.959505-03	4
\.
--
--
COPY public.compra (id_compra, id_conta, valor_compra, data_compra, datacriacao, ultimaatualizacao, desconto) FROM stdin;
8	9	304.90	2025-12-11 12:39:00-03	2025-12-14 12:40:01.77352-03	2026-04-11 21:21:20.480212-03	0.00
11	11	150.00	2026-02-10 08:43:40.617-03	2026-02-10 08:43:56.14909-03	2026-04-11 21:21:20.480212-03	0.00
12	11	50.00	2026-02-22 01:37:03.774-03	2026-02-22 01:37:12.687228-03	2026-04-11 21:21:20.480212-03	0.00
14	10	5.00	2026-02-22 01:38:37.291-03	2026-02-22 01:38:42.671983-03	2026-04-11 21:21:20.480212-03	0.00
15	9	167.90	2026-04-11 20:21:02.157-03	2026-04-11 20:21:23.085452-03	2026-04-11 21:21:20.480212-03	0.00
16	12	36.90	2026-04-11 20:21:31.33-03	2026-04-11 20:21:54.216607-03	2026-04-11 21:21:20.480212-03	0.00
17	12	209.00	2026-04-11 20:22:47.48-03	2026-04-11 20:23:35.17676-03	2026-04-11 21:21:20.480212-03	0.00
18	13	30.00	2026-04-11 20:28:37.788-03	2026-04-11 20:29:05.416002-03	2026-04-11 21:21:20.480212-03	0.00
19	13	60.80	2026-04-11 20:29:11.448-03	2026-04-11 20:30:25.185698-03	2026-04-11 21:21:20.480212-03	0.00
20	14	120.00	2026-04-11 20:31:54.351-03	2026-04-11 20:32:07.26592-03	2026-04-11 21:21:20.480212-03	0.00
21	14	60.00	2026-04-11 20:33:08.167-03	2026-04-11 20:33:22.896746-03	2026-04-11 21:21:20.480212-03	0.00
22	11	150.00	2026-04-11 20:47:01.952-03	2026-04-11 20:47:09.631929-03	2026-04-11 21:21:20.480212-03	0.00
\.
--
--
COPY public.conta (id_conta, id_cliente, saldo_devedor, datacriacao, ultimaatualizacao) FROM stdin;
10	10	0.50	2025-12-30 14:29:07.880046-03	2026-02-22 01:38:48.599551-03
9	9	167.90	2025-12-14 12:38:50.538103-03	2026-04-11 20:21:23.085452-03
12	12	245.90	2026-04-11 20:15:28.882164-03	2026-04-11 20:23:35.17676-03
13	13	90.80	2026-04-11 20:18:03.958479-03	2026-04-11 20:30:25.185698-03
14	14	180.00	2026-04-11 20:19:42.959505-03	2026-04-11 20:33:22.896746-03
11	11	320.00	2026-02-09 14:50:33.121957-03	2026-04-11 20:47:09.631929-03
\.
--
--
COPY public.item_compra (id_item_compra, id_compra, id_produto, quantidade, valor_unitario, datacriacao, ultimaatualizacao) FROM stdin;
10	8	3	1.000	304.90	2025-12-14 12:40:01.779805-03	2025-12-14 12:40:01.779805-03
13	11	5	3.000	50.00	2026-02-10 08:43:56.163726-03	2026-02-10 08:43:56.163726-03
14	12	5	1.000	50.00	2026-02-22 01:37:12.718822-03	2026-02-22 01:37:12.718822-03
16	14	4	1.000	5.00	2026-02-22 01:38:42.674674-03	2026-02-22 01:38:42.674674-03
17	15	8	1.000	167.90	2026-04-11 20:21:23.105453-03	2026-04-11 20:21:23.105453-03
18	16	7	1.000	36.90	2026-04-11 20:21:54.22876-03	2026-04-11 20:21:54.22876-03
19	17	6	1.000	209.00	2026-04-11 20:23:35.185879-03	2026-04-11 20:23:35.185879-03
20	18	11	1.000	30.00	2026-04-11 20:29:05.456488-03	2026-04-11 20:29:05.456488-03
21	19	9	1.000	34.90	2026-04-11 20:30:25.195472-03	2026-04-11 20:30:25.195472-03
22	19	12	1.000	25.90	2026-04-11 20:30:25.199256-03	2026-04-11 20:30:25.199256-03
23	20	10	1.000	120.00	2026-04-11 20:32:07.276108-03	2026-04-11 20:32:07.276108-03
24	21	13	1.000	60.00	2026-04-11 20:33:22.902087-03	2026-04-11 20:33:22.902087-03
25	22	5	1.000	50.00	2026-04-11 20:47:09.636034-03	2026-04-11 20:47:09.636034-03
26	22	14	1.000	100.00	2026-04-11 20:47:09.638843-03	2026-04-11 20:47:09.638843-03
\.
--
--
COPY public.movimento (id_movimento, id_conta, tipo, id_compra, id_pagamento) FROM stdin;
11	9	COMPRA	8	\N
15	11	COMPRA	11	\N
16	11	PAGAMENTO	\N	5
17	11	COMPRA	12	\N
19	10	COMPRA	14	\N
20	10	PAGAMENTO	\N	6
21	9	PAGAMENTO	\N	7
22	9	COMPRA	15	\N
23	12	COMPRA	16	\N
24	12	COMPRA	17	\N
25	13	COMPRA	18	\N
26	13	COMPRA	19	\N
27	14	COMPRA	20	\N
28	14	COMPRA	21	\N
29	11	COMPRA	22	\N
\.
--
--
COPY public.pagamento (id_pagamento, id_conta, valor_pagamento, data_pagamento, datacriacao, ultimaatualizacao) FROM stdin;
5	11	30.00	2026-02-10 11:46:13.782-03	2026-02-10 08:46:20.685033-03	2026-02-10 08:46:20.685033-03
6	10	4.50	2026-02-22 04:38:42.684-03	2026-02-22 01:38:48.599551-03	2026-02-22 01:38:48.599551-03
7	9	304.90	2026-03-26 21:55:00-03	2026-04-11 18:55:44.153982-03	2026-04-11 18:56:06.880648-03
\.
--
--
COPY public.produto (id_produto, nome, valor_produto, quantidade_estoque, datacriacao, ultimaatualizacao, id_usuario) FROM stdin;
3	Elisee	304.90	0.000	2025-12-14 12:37:44.745449-03	2025-12-14 12:40:01.783029-03	4
4	Sanzio	5.00	1.000	2025-12-30 14:29:21.511033-03	2026-02-22 01:38:42.676447-03	3
8	Refil chronos red rugas	167.90	0.000	2026-04-11 19:07:22.195456-03	2026-04-11 20:21:23.115496-03	4
7	Sabonete cuide-se bem diversos	36.90	0.000	2026-04-11 19:06:49.935146-03	2026-04-11 20:21:54.233518-03	4
6	Malbec tradicional	209.00	2.000	2026-04-11 18:58:11.278514-03	2026-04-11 20:23:35.188305-03	4
11	Sabonete líquido essencial trad	30.00	0.000	2026-04-11 20:28:08.462098-03	2026-04-11 20:29:05.463661-03	4
9	Cx sabonetes Natura Diversos	34.90	4.000	2026-04-11 19:08:29.042979-03	2026-04-11 20:30:25.197909-03	4
12	Creme oara mãos Natura	25.90	2.000	2026-04-11 20:28:31.053039-03	2026-04-11 20:30:25.200251-03	4
10	Imense colonia	120.00	0.000	2026-04-11 19:09:07.956134-03	2026-04-11 20:32:07.278296-03	4
13	Kit Rosa e Algodão	60.00	1.000	2026-04-11 20:32:59.735416-03	2026-04-11 20:33:22.90385-03	4
5	Produto 1	50.00	0.000	2026-02-09 14:56:31.874266-03	2026-04-11 20:47:09.638122-03	5
14	Produto 2	100.00	4.000	2026-04-11 20:46:59.907683-03	2026-04-11 20:47:09.639538-03	5
\.
--
--
COPY public.usuarios (id, nome_usuario, email, senha, datacriacao, ultimaatualizacao, reset_token, reset_token_expires) FROM stdin;
3	teste	teste@teste.teste	$2b$10$8/62A4Iwe1kh7kLAsy8GXOlzeimyfcZzQngRu57IpKwpCNErBIhUa	2025-11-26 20:43:43.704995	2026-02-22 01:37:35.233492	780b964a6360cac711f725f020b50c01a5d1116be4e1d84879a8348d8952bd55	2026-02-05 13:46:30.431-03
4	Janete Almeida 	janetecsalmeida@hotmail.com	$2a$10$9v0esABsWKAGuAq.uYmOG.J0z2tr6sszF.aK1vjKLhCg7kRHQ75HO	2025-12-14 12:36:18.23881	2026-04-11 18:54:25.707786	\N	\N
5	pedro vitor	pedroalmeidadias03@gmail.com	$2b$10$M78gQCAIMhF4dEwV5yTl3eilqWUg0K7lT.UNsGVC3Jgk.FAAwFHHy	2026-02-05 12:16:55.461971	2026-04-11 22:21:35.057324	0f74d743ed95552051c225697a2f84e4cd71c7910384a2278c8c506b56fc75b4	2026-02-22 02:18:56.174-03
\.
--
--
SELECT pg_catalog.setval('public.cliente_id_cliente_seq', 14, true);
--
--
SELECT pg_catalog.setval('public.compra_id_compra_seq', 22, true);
--
--
SELECT pg_catalog.setval('public.conta_id_conta_seq', 14, true);
--
--
SELECT pg_catalog.setval('public.item_compra_id_item_compra_seq', 26, true);
--
--
SELECT pg_catalog.setval('public.movimento_id_movimento_seq', 29, true);
--
--
SELECT pg_catalog.setval('public.pagamento_id_pagamento_seq', 7, true);
--
--
SELECT pg_catalog.setval('public.produto_id_produto_seq', 14, true);
--
--
SELECT pg_catalog.setval('public.usuarios_id_seq', 5, true);
--
--
ALTER TABLE ONLY public.cliente
    ADD CONSTRAINT cliente_email_unico UNIQUE (email);
--
--
ALTER TABLE ONLY public.cliente
    ADD CONSTRAINT cliente_pkey PRIMARY KEY (id_cliente);
--
--
ALTER TABLE ONLY public.compra
    ADD CONSTRAINT compra_pkey PRIMARY KEY (id_compra);
--
--
ALTER TABLE ONLY public.conta
    ADD CONSTRAINT conta_pkey PRIMARY KEY (id_conta);
--
--
ALTER TABLE ONLY public.item_compra
    ADD CONSTRAINT item_compra_pkey PRIMARY KEY (id_item_compra);
--
--
ALTER TABLE ONLY public.movimento
    ADD CONSTRAINT movimento_pkey PRIMARY KEY (id_movimento);
--
--
ALTER TABLE ONLY public.pagamento
    ADD CONSTRAINT pagamento_pkey PRIMARY KEY (id_pagamento);
--
--
ALTER TABLE ONLY public.produto
    ADD CONSTRAINT produto_pkey PRIMARY KEY (id_produto);
--
--
ALTER TABLE ONLY public.conta
    ADD CONSTRAINT unique_conta_por_cliente UNIQUE (id_cliente);
--
--
ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);
--
--
ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);
--
--
CREATE INDEX idx_cliente_id_usuario ON public.cliente USING btree (id_usuario);
--
--
CREATE INDEX idx_cliente_nome ON public.cliente USING btree (nome);
--
--
CREATE INDEX idx_compra_id_conta ON public.compra USING btree (id_conta);
--
--
CREATE INDEX idx_conta_id_cliente ON public.conta USING btree (id_cliente);
--
--
CREATE INDEX idx_item_compra_id_compra ON public.item_compra USING btree (id_compra);
--
--
CREATE INDEX idx_item_compra_id_produto ON public.item_compra USING btree (id_produto);
--
--
CREATE INDEX idx_pagamento_id_conta ON public.pagamento USING btree (id_conta);
--
--
CREATE INDEX idx_produto_id_usuario ON public.produto USING btree (id_usuario);
--
--
CREATE INDEX idx_produto_nome ON public.produto USING btree (nome);
--
--
CREATE INDEX idx_usuarios_email ON public.usuarios USING btree (email);
--
--
CREATE INDEX idx_usuarios_reset_token ON public.usuarios USING btree (reset_token) WHERE (reset_token IS NOT NULL);
--
--
CREATE UNIQUE INDEX usuarios_nome_usuario_uk ON public.usuarios USING btree (nome_usuario);
--
--
CREATE TRIGGER log_compra AFTER INSERT ON public.compra FOR EACH ROW EXECUTE FUNCTION public.trg_log_compra();
--
--
CREATE TRIGGER log_pagamento AFTER INSERT ON public.pagamento FOR EACH ROW EXECUTE FUNCTION public.trg_log_pagamento();
--
--
CREATE TRIGGER trg_cliente_cria_conta AFTER INSERT ON public.cliente FOR EACH ROW EXECUTE FUNCTION public.fn_cria_conta_para_novo_cliente();
--
--
CREATE TRIGGER trg_cliente_update BEFORE UPDATE ON public.cliente FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp_cliente();
--
--
CREATE TRIGGER trg_compra_ad AFTER DELETE ON public.compra FOR EACH ROW EXECUTE FUNCTION public.trg_compra_after_delete();
--
--
CREATE TRIGGER trg_compra_ai AFTER INSERT ON public.compra FOR EACH ROW EXECUTE FUNCTION public.trg_compra_after_insert();
--
--
CREATE TRIGGER trg_compra_au AFTER UPDATE ON public.compra FOR EACH ROW EXECUTE FUNCTION public.trg_compra_after_update();
--
--
CREATE TRIGGER trg_compra_update BEFORE UPDATE ON public.compra FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp_compra();
--
--
CREATE TRIGGER trg_conta_update BEFORE UPDATE ON public.conta FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp_conta();
--
--
CREATE TRIGGER trg_item_compra_update BEFORE UPDATE ON public.item_compra FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp_item_compra();
--
--
CREATE TRIGGER trg_pagamento_after_delete AFTER DELETE ON public.pagamento FOR EACH ROW EXECUTE FUNCTION public.trg_pagamento_after_delete();
--
--
CREATE TRIGGER trg_pagamento_after_insert AFTER INSERT ON public.pagamento FOR EACH ROW EXECUTE FUNCTION public.trg_pagamento_after_insert();
--
--
CREATE TRIGGER trg_pagamento_after_update AFTER UPDATE ON public.pagamento FOR EACH ROW EXECUTE FUNCTION public.trg_pagamento_after_update();
--
--
CREATE TRIGGER trg_pagamento_update BEFORE UPDATE ON public.pagamento FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp_pagamento();
--
--
CREATE TRIGGER trg_produto_update BEFORE UPDATE ON public.produto FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp_produto();
--
--
CREATE TRIGGER trg_usuarios_updated_at BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();
--
--
ALTER TABLE ONLY public.cliente
    ADD CONSTRAINT fk_cliente_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id) ON DELETE CASCADE;
--
--
ALTER TABLE ONLY public.compra
    ADD CONSTRAINT fk_compra_conta FOREIGN KEY (id_conta) REFERENCES public.conta(id_conta) ON DELETE CASCADE;
--
--
ALTER TABLE ONLY public.conta
    ADD CONSTRAINT fk_conta_cliente FOREIGN KEY (id_cliente) REFERENCES public.cliente(id_cliente) ON DELETE CASCADE;
--
--
ALTER TABLE ONLY public.item_compra
    ADD CONSTRAINT fk_item_compra_compra FOREIGN KEY (id_compra) REFERENCES public.compra(id_compra) ON DELETE CASCADE;
--
--
ALTER TABLE ONLY public.item_compra
    ADD CONSTRAINT fk_item_compra_produto FOREIGN KEY (id_produto) REFERENCES public.produto(id_produto) ON DELETE RESTRICT;
--
--
ALTER TABLE ONLY public.movimento
    ADD CONSTRAINT fk_movimento_compra FOREIGN KEY (id_compra) REFERENCES public.compra(id_compra) ON DELETE SET NULL;
--
--
ALTER TABLE ONLY public.movimento
    ADD CONSTRAINT fk_movimento_pagamento FOREIGN KEY (id_pagamento) REFERENCES public.pagamento(id_pagamento) ON DELETE SET NULL;
--
--
ALTER TABLE ONLY public.pagamento
    ADD CONSTRAINT fk_pagamento_conta FOREIGN KEY (id_conta) REFERENCES public.conta(id_conta) ON DELETE CASCADE;
--
--
ALTER TABLE ONLY public.produto
    ADD CONSTRAINT fk_produto_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id) ON DELETE CASCADE;
--
--
ALTER TABLE ONLY public.movimento
    ADD CONSTRAINT movimento_id_conta_fkey FOREIGN KEY (id_conta) REFERENCES public.conta(id_conta) ON DELETE CASCADE;
--
--
