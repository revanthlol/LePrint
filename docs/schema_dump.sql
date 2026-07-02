--
-- PostgreSQL database dump
--

-- Dumped from database version 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jobs (
    id character varying(255) NOT NULL,
    user_id character varying(255),
    kiosk_id character varying(255) NOT NULL,
    filename character varying(255) NOT NULL,
    file_path text NOT NULL,
    file_size integer,
    pages integer NOT NULL,
    price_per_page numeric(10,2) NOT NULL,
    total_cost numeric(10,2) NOT NULL,
    status character varying(50) DEFAULT 'PENDING'::character varying,
    payment_status character varying(50) DEFAULT 'pending'::character varying,
    payment_id character varying(255),
    job_type character varying(30) DEFAULT 'print'::character varying,
    metadata jsonb DEFAULT '{}'::jsonb,
    scan_options jsonb DEFAULT '{}'::jsonb,
    output_file_url text,
    print_token character varying(255),
    token_timestamp bigint,
    error_message text,
    pages_printed integer,
    retry_count integer DEFAULT 0,
    status_message text,
    last_status_update timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    paid_at timestamp without time zone,
    queued_at timestamp without time zone,
    print_started_at timestamp without time zone,
    print_completed_at timestamp without time zone,
    CONSTRAINT max_retry_count CHECK ((retry_count <= 3)),
    CONSTRAINT valid_job_status CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'PAID'::character varying, 'QUEUED'::character varying, 'SENT_TO_PI'::character varying, 'PRINTING'::character varying, 'COMPLETED'::character varying, 'FAILED'::character varying, 'EXPIRED'::character varying, 'CANCELLED'::character varying, 'DISCOVERING_SCANNER'::character varying, 'SCANNING'::character varying, 'PROCESSING'::character varying, 'SCANNING_ORIGINAL'::character varying, 'PROCESSING_COPY'::character varying, 'PRINTING_COPY'::character varying])::text[]))),
    CONSTRAINT valid_job_type CHECK (((job_type)::text = ANY ((ARRAY['print'::character varying, 'scan'::character varying, 'xerox'::character varying])::text[]))),
    CONSTRAINT valid_payment_status CHECK (((payment_status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'failed'::character varying, 'refunded'::character varying])::text[])))
);


--
-- Name: kiosks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kiosks (
    id character varying(255) NOT NULL,
    hostname character varying(255),
    printer_name character varying(255),
    status character varying(50) DEFAULT 'offline'::character varying,
    last_seen timestamp without time zone,
    uptime double precision,
    socket_id character varying(255),
    printer_status character varying(50) DEFAULT 'unknown'::character varying,
    printer_status_detail text,
    last_status_check timestamp without time zone,
    current_paper_count integer DEFAULT 500,
    price_per_page numeric(10,2) DEFAULT 3.00,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    location_name text,
    printer_brand character varying(50),
    printer_driver character varying(100),
    latitude numeric(10,8),
    longitude numeric(11,8),
    CONSTRAINT paper_count_non_negative CHECK ((current_paper_count >= 0)),
    CONSTRAINT valid_kiosk_status CHECK (((status)::text = ANY ((ARRAY['online'::character varying, 'offline'::character varying, 'maintenance'::character varying, 'busy'::character varying])::text[]))),
    CONSTRAINT valid_printer_status CHECK (((printer_status)::text = ANY ((ARRAY['healthy'::character varying, 'error'::character varying, 'unknown'::character varying])::text[])))
);


--
-- Name: active_jobs; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.active_jobs AS
 SELECT j.id,
    j.kiosk_id,
    k.hostname AS kiosk_name,
    j.job_type,
    j.filename,
    j.pages,
    j.total_cost,
    j.status,
    j.status_message,
    j.created_at,
    j.print_started_at
   FROM (public.jobs j
     LEFT JOIN public.kiosks k ON (((j.kiosk_id)::text = (k.id)::text)))
  WHERE ((j.status)::text = ANY ((ARRAY['PENDING'::character varying, 'PAID'::character varying, 'QUEUED'::character varying, 'PRINTING'::character varying, 'SCANNING'::character varying, 'SCANNING_ORIGINAL'::character varying])::text[]))
  ORDER BY j.created_at DESC;


--
-- Name: admin_actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_actions (
    id integer NOT NULL,
    admin_id character varying(255),
    action_type character varying(50) NOT NULL,
    target_type character varying(50),
    target_id character varying(255),
    details jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: admin_actions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_actions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_actions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_actions_id_seq OWNED BY public.admin_actions.id;


--
-- Name: daily_kiosk_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.daily_kiosk_stats AS
 SELECT k.id AS kiosk_id,
    k.hostname AS kiosk_name,
    date(j.created_at) AS date,
    count(j.id) AS total_jobs,
    count(
        CASE
            WHEN ((j.status)::text = 'COMPLETED'::text) THEN 1
            ELSE NULL::integer
        END) AS completed_jobs,
    count(
        CASE
            WHEN ((j.status)::text = 'FAILED'::text) THEN 1
            ELSE NULL::integer
        END) AS failed_jobs,
    count(
        CASE
            WHEN ((j.job_type)::text = 'print'::text) THEN 1
            ELSE NULL::integer
        END) AS print_jobs,
    count(
        CASE
            WHEN ((j.job_type)::text = 'scan'::text) THEN 1
            ELSE NULL::integer
        END) AS scan_jobs,
    count(
        CASE
            WHEN ((j.job_type)::text = 'xerox'::text) THEN 1
            ELSE NULL::integer
        END) AS xerox_jobs,
    COALESCE(sum(
        CASE
            WHEN ((j.payment_status)::text = 'paid'::text) THEN j.total_cost
            ELSE (0)::numeric
        END), (0)::numeric) AS revenue,
    COALESCE(sum(
        CASE
            WHEN ((j.status)::text = 'COMPLETED'::text) THEN j.pages
            ELSE 0
        END), (0)::bigint) AS pages_printed
   FROM (public.kiosks k
     LEFT JOIN public.jobs j ON ((((k.id)::text = (j.kiosk_id)::text) AND (j.created_at >= (CURRENT_DATE - '30 days'::interval)))))
  GROUP BY k.id, k.hostname, (date(j.created_at))
  ORDER BY (date(j.created_at)) DESC, k.id;


--
-- Name: kiosk_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.kiosk_stats AS
 SELECT k.id,
    k.hostname,
    k.status,
    k.printer_status,
    k.current_paper_count,
    count(j.id) AS total_jobs,
    count(
        CASE
            WHEN ((j.status)::text = 'COMPLETED'::text) THEN 1
            ELSE NULL::integer
        END) AS completed_jobs,
    count(
        CASE
            WHEN ((j.status)::text = 'FAILED'::text) THEN 1
            ELSE NULL::integer
        END) AS failed_jobs,
    count(
        CASE
            WHEN ((j.job_type)::text = 'print'::text) THEN 1
            ELSE NULL::integer
        END) AS print_jobs,
    count(
        CASE
            WHEN ((j.job_type)::text = 'scan'::text) THEN 1
            ELSE NULL::integer
        END) AS scan_jobs,
    count(
        CASE
            WHEN ((j.job_type)::text = 'xerox'::text) THEN 1
            ELSE NULL::integer
        END) AS xerox_jobs,
    COALESCE(sum(
        CASE
            WHEN ((j.payment_status)::text = 'paid'::text) THEN j.total_cost
            ELSE (0)::numeric
        END), (0)::numeric) AS total_revenue
   FROM (public.kiosks k
     LEFT JOIN public.jobs j ON (((k.id)::text = (j.kiosk_id)::text)))
  GROUP BY k.id, k.hostname, k.status, k.printer_status, k.current_paper_count;


--
-- Name: settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settings (
    key character varying(255) NOT NULL,
    value jsonb NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: system_metrics; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.system_metrics AS
 SELECT count(DISTINCT id) AS total_jobs,
    count(
        CASE
            WHEN ((status)::text = 'COMPLETED'::text) THEN 1
            ELSE NULL::integer
        END) AS completed_jobs,
    count(
        CASE
            WHEN ((status)::text = 'FAILED'::text) THEN 1
            ELSE NULL::integer
        END) AS failed_jobs,
    count(
        CASE
            WHEN ((job_type)::text = 'print'::text) THEN 1
            ELSE NULL::integer
        END) AS print_jobs,
    count(
        CASE
            WHEN ((job_type)::text = 'scan'::text) THEN 1
            ELSE NULL::integer
        END) AS scan_jobs,
    count(
        CASE
            WHEN ((job_type)::text = 'xerox'::text) THEN 1
            ELSE NULL::integer
        END) AS xerox_jobs,
    COALESCE(sum(
        CASE
            WHEN ((payment_status)::text = 'paid'::text) THEN total_cost
            ELSE (0)::numeric
        END), (0)::numeric) AS total_revenue,
    COALESCE(sum(
        CASE
            WHEN ((status)::text = 'COMPLETED'::text) THEN pages
            ELSE 0
        END), (0)::bigint) AS total_pages_printed,
    round((((count(
        CASE
            WHEN ((status)::text = 'COMPLETED'::text) THEN 1
            ELSE NULL::integer
        END))::numeric / (NULLIF(count(id), 0))::numeric) * (100)::numeric), 2) AS success_rate
   FROM public.jobs j
  WHERE (created_at >= (CURRENT_DATE - '30 days'::interval));


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(255),
    role character varying(20) DEFAULT 'user'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_user_role CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'admin'::character varying, 'superadmin'::character varying])::text[])))
);


--
-- Name: admin_actions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_actions ALTER COLUMN id SET DEFAULT nextval('public.admin_actions_id_seq'::regclass);


--
-- Name: admin_actions admin_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_actions
    ADD CONSTRAINT admin_actions_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: kiosks kiosks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kiosks
    ADD CONSTRAINT kiosks_pkey PRIMARY KEY (id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (key);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_admin_actions_admin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_actions_admin ON public.admin_actions USING btree (admin_id);


--
-- Name: idx_admin_actions_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_actions_created ON public.admin_actions USING btree (created_at DESC);


--
-- Name: idx_jobs_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jobs_created ON public.jobs USING btree (created_at DESC);


--
-- Name: idx_jobs_kiosk; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jobs_kiosk ON public.jobs USING btree (kiosk_id);


--
-- Name: idx_jobs_kiosk_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jobs_kiosk_status ON public.jobs USING btree (kiosk_id, status);


--
-- Name: idx_jobs_last_status_update; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jobs_last_status_update ON public.jobs USING btree (last_status_update);


--
-- Name: idx_jobs_payment_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jobs_payment_status ON public.jobs USING btree (payment_status);


--
-- Name: idx_jobs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jobs_status ON public.jobs USING btree (status);


--
-- Name: idx_jobs_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jobs_type ON public.jobs USING btree (job_type);


--
-- Name: idx_jobs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jobs_user ON public.jobs USING btree (user_id);


--
-- Name: idx_kiosks_last_seen; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kiosks_last_seen ON public.kiosks USING btree (last_seen DESC);


--
-- Name: idx_kiosks_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kiosks_location ON public.kiosks USING btree (latitude, longitude) WHERE ((latitude IS NOT NULL) AND (longitude IS NOT NULL));


--
-- Name: idx_kiosks_printer_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kiosks_printer_status ON public.kiosks USING btree (printer_status);


--
-- Name: idx_kiosks_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kiosks_status ON public.kiosks USING btree (status);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: jobs update_jobs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: kiosks update_kiosks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_kiosks_updated_at BEFORE UPDATE ON public.kiosks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: admin_actions admin_actions_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_actions
    ADD CONSTRAINT admin_actions_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: jobs jobs_kiosk_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_kiosk_id_fkey FOREIGN KEY (kiosk_id) REFERENCES public.kiosks(id) ON DELETE CASCADE;


--
-- Name: jobs jobs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--
