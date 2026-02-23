-- ============================================================================
-- MIGRATION: Crear tabla core.verifications para verificación de usuarios
-- Fecha: 2025-10-28
-- Descripción: Tabla para gestionar verificaciones de identidad de usuarios
-- ============================================================================

SET search_path TO core, public;

-- ============================================================================
-- 1. CREAR TABLA core.verifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS core.verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Tipo de verificación y objetivo
    target_type VARCHAR(20) NOT NULL,  -- 'USER', 'LISTING', 'AGENCY'
    target_id UUID,  -- ID del objeto a verificar (opcional)
    
    -- Estado de la verificación
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- 'PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW'
    priority VARCHAR(20) DEFAULT 'MEDIUM',  -- 'HIGH', 'MEDIUM', 'LOW'
    
    -- Usuarios involucrados
    requester_id UUID NOT NULL,
    moderator_id UUID,
    assigned_at TIMESTAMP WITH TIME ZONE,
    
    -- Documentos y notas
    documents JSONB DEFAULT '[]'::jsonb,
    requester_notes TEXT,
    moderator_notes TEXT,
    requirements JSONB,
    
    -- Seguimiento
    submission_count INTEGER DEFAULT 0,
    review_started_at TIMESTAMP WITH TIME ZONE,
    review_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Datos de verificación (para OCR y validación)
    verification_data JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT verifications_requester_fk FOREIGN KEY (requester_id) 
        REFERENCES core.users(id) ON DELETE CASCADE,
    CONSTRAINT verifications_moderator_fk FOREIGN KEY (moderator_id) 
        REFERENCES core.users(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT verifications_status_check CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW')),
    CONSTRAINT verifications_target_type_check CHECK (target_type IN ('USER', 'LISTING', 'AGENCY')),
    CONSTRAINT verifications_priority_check CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW'))
);

-- ============================================================================
-- 2. CREAR ÍNDICES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_verifications_requester 
    ON core.verifications(requester_id);

CREATE INDEX IF NOT EXISTS idx_verifications_moderator 
    ON core.verifications(moderator_id);

CREATE INDEX IF NOT EXISTS idx_verifications_status 
    ON core.verifications(status);

CREATE INDEX IF NOT EXISTS idx_verifications_target 
    ON core.verifications(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_verifications_created 
    ON core.verifications(created_at DESC);

-- Índice para búsquedas de verificaciones pendientes por usuario y tipo
CREATE INDEX IF NOT EXISTS idx_verifications_user_type_status 
    ON core.verifications(requester_id, target_type, status);

-- ============================================================================
-- 3. CREAR TABLA core.verification_documents
-- ============================================================================
CREATE TABLE IF NOT EXISTS core.verification_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id UUID NOT NULL,
    document_type VARCHAR(50) NOT NULL,  -- 'dni_front', 'dni_back', 'proof_of_address', etc.
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT verification_documents_verification_fk 
        FOREIGN KEY (verification_id) 
        REFERENCES core.verifications(id) 
        ON DELETE CASCADE
);

-- Índice para buscar documentos por verificación
CREATE INDEX IF NOT EXISTS idx_verification_documents_verification 
    ON core.verification_documents(verification_id);

-- ============================================================================
-- 4. TRIGGER PARA updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_verification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_verifications_updated_at ON core.verifications;
CREATE TRIGGER trg_verifications_updated_at
    BEFORE UPDATE ON core.verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_verification_updated_at();

-- ============================================================================
-- 5. COMENTARIOS
-- ============================================================================
COMMENT ON TABLE core.verifications IS 
'Tabla para gestionar verificaciones de identidad y documentos de usuarios, propiedades y agencias';

COMMENT ON COLUMN core.verifications.target_type IS 
'Tipo de entidad a verificar: USER (identidad), LISTING (propiedad), AGENCY (agencia)';

COMMENT ON COLUMN core.verifications.verification_data IS 
'Datos extraídos de OCR y validación (DNI, nombres, confianza, etc.)';

COMMENT ON COLUMN core.verifications.documents IS 
'Array JSON con información de documentos subidos (deprecated, usar verification_documents)';

COMMENT ON TABLE core.verification_documents IS 
'Documentos asociados a una verificación (DNI, comprobantes, etc.)';