--
-- PostgreSQL database dump
--

\restrict BdkBNpxoI3lV2q04ZBOfnytumT3rB8uCqcu2KZeXbpdEtfbXYr7aZZTX0QhmHpv

-- Dumped from database version 17.5 (aa1f746)
-- Dumped by pg_dump version 18.0

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
-- Name: ajuste_saldo_conta(bigint, numeric); Type: FUNCTION; Schema: public; Owner: neondb_owner
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


ALTER FUNCTION public.ajuste_saldo_conta(p_id_conta bigint, p_delta numeric) OWNER TO neondb_owner;

--
-- Name: atualizar_timestamp_cliente(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.atualizar_timestamp_cliente() RETURNS trigger
    LANGUAGE plpgsql
    AS $$


BEGIN


    NEW.UltimaAtualizacao = NOW();


    RETURN NEW;


END;


$$;


ALTER FUNCTION public.atualizar_timestamp_cliente() OWNER TO neondb_owner;

--
-- Name: atualizar_timestamp_compra(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.atualizar_timestamp_compra() RETURNS trigger
    LANGUAGE plpgsql
    AS $$


BEGIN


    NEW.UltimaAtualizacao = NOW();


    RETURN NEW;


END;


$$;


ALTER FUNCTION public.atualizar_timestamp_compra() OWNER TO neondb_owner;

--
-- Name: atualizar_timestamp_conta(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.atualizar_timestamp_conta() RETURNS trigger
    LANGUAGE plpgsql
    AS $$


BEGIN


    NEW.UltimaAtualizacao = NOW();


    RETURN NEW;


END;


$$;


ALTER FUNCTION public.atualizar_timestamp_conta() OWNER TO neondb_owner;

--
-- Name: atualizar_timestamp_item_compra(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.atualizar_timestamp_item_compra() RETURNS trigger
    LANGUAGE plpgsql
    AS $$


BEGIN


    NEW.UltimaAtualizacao = NOW();


    RETURN NEW;


END;


$$;


ALTER FUNCTION public.atualizar_timestamp_item_compra() OWNER TO neondb_owner;

--
-- Name: atualizar_timestamp_pagamento(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.atualizar_timestamp_pagamento() RETURNS trigger
    LANGUAGE plpgsql
    AS $$


BEGIN


    NEW.UltimaAtualizacao = NOW();


    RETURN NEW;


END;


$$;


ALTER FUNCTION public.atualizar_timestamp_pagamento() OWNER TO neondb_owner;

--
-- Name: atualizar_timestamp_produto(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.atualizar_timestamp_produto() RETURNS trigger
    LANGUAGE plpgsql
    AS $$


BEGIN


    NEW.UltimaAtualizacao = NOW();


    RETURN NEW;


END;


$$;


ALTER FUNCTION public.atualizar_timestamp_produto() OWNER TO neondb_owner;

--
-- Name: atualizar_updated_at(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.atualizar_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

    NEW.updated_at = NOW();

    RETURN NEW;

END;

$$;


ALTER FUNCTION public.atualizar_updated_at() OWNER TO neondb_owner;

--
-- Name: fn_cria_conta_para_novo_cliente(); Type: FUNCTION; Schema: public; Owner: neondb_owner
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


ALTER FUNCTION public.fn_cria_conta_para_novo_cliente() OWNER TO neondb_owner;

--
-- Name: recalc_saldo_conta(bigint); Type: FUNCTION; Schema: public; Owner: neondb_owner
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


ALTER FUNCTION public.recalc_saldo_conta(p_id_conta bigint) OWNER TO neondb_owner;

--
-- Name: recalc_todas_saldos(); Type: FUNCTION; Schema: public; Owner: neondb_owner
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


ALTER FUNCTION public.recalc_todas_saldos() OWNER TO neondb_owner;

--
-- Name: trg_compra_after_delete(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.trg_compra_after_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$


BEGIN


    -- Ao deletar uma compra, subtrai-se o valor (reverte a adiΒo anterior)


    PERFORM ajuste_saldo_conta(OLD.ID_Conta, - OLD.Valor_Compra);


    RETURN OLD;


END;


$$;


ALTER FUNCTION public.trg_compra_after_delete() OWNER TO neondb_owner;

--
-- Name: trg_compra_after_update(); Type: FUNCTION; Schema: public; Owner: neondb_owner
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


ALTER FUNCTION public.trg_compra_after_update() OWNER TO neondb_owner;

--
-- Name: trg_log_compra(); Type: FUNCTION; Schema: public; Owner: neondb_owner
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


ALTER FUNCTION public.trg_log_compra() OWNER TO neondb_owner;

--
-- Name: trg_log_pagamento(); Type: FUNCTION; Schema: public; Owner: neondb_owner
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


ALTER FUNCTION public.trg_log_pagamento() OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cliente; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.cliente OWNER TO neondb_owner;

--
-- Name: cliente_id_cliente_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
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
-- Name: compra; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.compra (
    id_compra bigint NOT NULL,
    id_conta bigint NOT NULL,
    valor_compra numeric(12,2) NOT NULL,
    data_compra timestamp with time zone DEFAULT now() NOT NULL,
    datacriacao timestamp with time zone DEFAULT now() NOT NULL,
    ultimaatualizacao timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.compra OWNER TO neondb_owner;

--
-- Name: compra_id_compra_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
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
-- Name: conta; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.conta (
    id_conta bigint NOT NULL,
    id_cliente bigint NOT NULL,
    saldo_devedor numeric(12,2) DEFAULT 0 NOT NULL,
    datacriacao timestamp with time zone DEFAULT now() NOT NULL,
    ultimaatualizacao timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.conta OWNER TO neondb_owner;

--
-- Name: conta_id_conta_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
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
-- Name: item_compra; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.item_compra OWNER TO neondb_owner;

--
-- Name: item_compra_id_item_compra_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
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
-- Name: movimento; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.movimento OWNER TO neondb_owner;

--
-- Name: movimento_id_movimento_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.movimento_id_movimento_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.movimento_id_movimento_seq OWNER TO neondb_owner;

--
-- Name: movimento_id_movimento_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.movimento_id_movimento_seq OWNED BY public.movimento.id_movimento;


--
-- Name: pagamento; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.pagamento OWNER TO neondb_owner;

--
-- Name: pagamento_id_pagamento_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
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
-- Name: produto; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.produto OWNER TO neondb_owner;

--
-- Name: produto_id_produto_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
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
-- Name: usuarios; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nome_usuario character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    senha text NOT NULL,
    datacriacao timestamp without time zone DEFAULT now() NOT NULL,
    ultimaatualizacao timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.usuarios OWNER TO neondb_owner;

--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_seq OWNER TO neondb_owner;

--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: v_movimento_completo; Type: VIEW; Schema: public; Owner: neondb_owner
--

CREATE VIEW public.v_movimento_completo AS
 SELECT m.id_movimento,
    m.id_conta,
    m.tipo,
    COALESCE(c.valor_compra, p.valor_pagamento) AS valor,
    COALESCE(c.data_compra, p.data_pagamento) AS data_movimento,
    m.id_compra,
    m.id_pagamento
   FROM ((public.movimento m
     LEFT JOIN public.compra c ON ((m.id_compra = c.id_compra)))
     LEFT JOIN public.pagamento p ON ((m.id_pagamento = p.id_pagamento)));


ALTER VIEW public.v_movimento_completo OWNER TO neondb_owner;

--
-- Name: movimento id_movimento; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.movimento ALTER COLUMN id_movimento SET DEFAULT nextval('public.movimento_id_movimento_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Name: cliente cliente_email_unico; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cliente
    ADD CONSTRAINT cliente_email_unico UNIQUE (email);


--
-- Name: cliente cliente_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cliente
    ADD CONSTRAINT cliente_pkey PRIMARY KEY (id_cliente);


--
-- Name: compra compra_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.compra
    ADD CONSTRAINT compra_pkey PRIMARY KEY (id_compra);


--
-- Name: conta conta_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.conta
    ADD CONSTRAINT conta_pkey PRIMARY KEY (id_conta);


--
-- Name: item_compra item_compra_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.item_compra
    ADD CONSTRAINT item_compra_pkey PRIMARY KEY (id_item_compra);


--
-- Name: movimento movimento_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.movimento
    ADD CONSTRAINT movimento_pkey PRIMARY KEY (id_movimento);


--
-- Name: pagamento pagamento_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pagamento
    ADD CONSTRAINT pagamento_pkey PRIMARY KEY (id_pagamento);


--
-- Name: produto produto_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.produto
    ADD CONSTRAINT produto_pkey PRIMARY KEY (id_produto);


--
-- Name: conta unique_conta_por_cliente; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.conta
    ADD CONSTRAINT unique_conta_por_cliente UNIQUE (id_cliente);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: idx_cliente_id_usuario; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_cliente_id_usuario ON public.cliente USING btree (id_usuario);


--
-- Name: idx_cliente_nome; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_cliente_nome ON public.cliente USING btree (nome);


--
-- Name: idx_compra_id_conta; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_compra_id_conta ON public.compra USING btree (id_conta);


--
-- Name: idx_conta_id_cliente; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_conta_id_cliente ON public.conta USING btree (id_cliente);


--
-- Name: idx_item_compra_id_compra; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_item_compra_id_compra ON public.item_compra USING btree (id_compra);


--
-- Name: idx_item_compra_id_produto; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_item_compra_id_produto ON public.item_compra USING btree (id_produto);


--
-- Name: idx_pagamento_id_conta; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_pagamento_id_conta ON public.pagamento USING btree (id_conta);


--
-- Name: idx_produto_id_usuario; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_produto_id_usuario ON public.produto USING btree (id_usuario);


--
-- Name: idx_produto_nome; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_produto_nome ON public.produto USING btree (nome);


--
-- Name: usuarios_nome_usuario_uk; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX usuarios_nome_usuario_uk ON public.usuarios USING btree (nome_usuario);


--
-- Name: compra log_compra; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER log_compra AFTER INSERT ON public.compra FOR EACH ROW EXECUTE FUNCTION public.trg_log_compra();


--
-- Name: pagamento log_pagamento; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER log_pagamento AFTER INSERT ON public.pagamento FOR EACH ROW EXECUTE FUNCTION public.trg_log_pagamento();


--
-- Name: cliente trg_cliente_cria_conta; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_cliente_cria_conta AFTER INSERT ON public.cliente FOR EACH ROW EXECUTE FUNCTION public.fn_cria_conta_para_novo_cliente();


--
-- Name: cliente trg_cliente_update; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_cliente_update BEFORE UPDATE ON public.cliente FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp_cliente();


--
-- Name: compra trg_compra_ad; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_compra_ad AFTER DELETE ON public.compra FOR EACH ROW EXECUTE FUNCTION public.trg_compra_after_delete();


--
-- Name: compra trg_compra_au; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_compra_au AFTER UPDATE ON public.compra FOR EACH ROW EXECUTE FUNCTION public.trg_compra_after_update();


--
-- Name: compra trg_compra_update; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_compra_update BEFORE UPDATE ON public.compra FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp_compra();


--
-- Name: conta trg_conta_update; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_conta_update BEFORE UPDATE ON public.conta FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp_conta();


--
-- Name: item_compra trg_item_compra_update; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_item_compra_update BEFORE UPDATE ON public.item_compra FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp_item_compra();


--
-- Name: pagamento trg_pagamento_update; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_pagamento_update BEFORE UPDATE ON public.pagamento FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp_pagamento();


--
-- Name: produto trg_produto_update; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_produto_update BEFORE UPDATE ON public.produto FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp_produto();


--
-- Name: usuarios trg_usuarios_updated_at; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_usuarios_updated_at BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();


--
-- Name: cliente fk_cliente_usuario; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cliente
    ADD CONSTRAINT fk_cliente_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: compra fk_compra_conta; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.compra
    ADD CONSTRAINT fk_compra_conta FOREIGN KEY (id_conta) REFERENCES public.conta(id_conta) ON DELETE CASCADE;


--
-- Name: conta fk_conta_cliente; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.conta
    ADD CONSTRAINT fk_conta_cliente FOREIGN KEY (id_cliente) REFERENCES public.cliente(id_cliente) ON DELETE CASCADE;


--
-- Name: item_compra fk_item_compra_compra; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.item_compra
    ADD CONSTRAINT fk_item_compra_compra FOREIGN KEY (id_compra) REFERENCES public.compra(id_compra) ON DELETE CASCADE;


--
-- Name: item_compra fk_item_compra_produto; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.item_compra
    ADD CONSTRAINT fk_item_compra_produto FOREIGN KEY (id_produto) REFERENCES public.produto(id_produto) ON DELETE RESTRICT;


--
-- Name: movimento fk_movimento_compra; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.movimento
    ADD CONSTRAINT fk_movimento_compra FOREIGN KEY (id_compra) REFERENCES public.compra(id_compra) ON DELETE SET NULL;


--
-- Name: movimento fk_movimento_pagamento; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.movimento
    ADD CONSTRAINT fk_movimento_pagamento FOREIGN KEY (id_pagamento) REFERENCES public.pagamento(id_pagamento) ON DELETE SET NULL;


--
-- Name: pagamento fk_pagamento_conta; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pagamento
    ADD CONSTRAINT fk_pagamento_conta FOREIGN KEY (id_conta) REFERENCES public.conta(id_conta) ON DELETE CASCADE;


--
-- Name: produto fk_produto_usuario; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.produto
    ADD CONSTRAINT fk_produto_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: movimento movimento_id_conta_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.movimento
    ADD CONSTRAINT movimento_id_conta_fkey FOREIGN KEY (id_conta) REFERENCES public.conta(id_conta) ON DELETE CASCADE;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict BdkBNpxoI3lV2q04ZBOfnytumT3rB8uCqcu2KZeXbpdEtfbXYr7aZZTX0QhmHpv

