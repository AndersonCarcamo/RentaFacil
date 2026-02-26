"""add_missing_model_tables

Revision ID: a4f6e2fb3c10
Revises: d187588fa76d
Create Date: 2026-02-25 14:20:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'a4f6e2fb3c10'
down_revision = 'd187588fa76d'
branch_labels = None
depends_on = None


webhook_event_type_enum = sa.Enum(
    'LISTING_CREATED',
    'LISTING_UPDATED',
    'LISTING_DELETED',
    'USER_REGISTERED',
    'PAYMENT_COMPLETED',
    'LEAD_CREATED',
    name='webhookeventtype'
)

webhook_status_enum = sa.Enum(
    'PENDING',
    'SUCCESSFUL',
    'FAILED',
    'RETRYING',
    name='webhookstatus'
)


def _table_exists(table_name: str, schema: str = 'public') -> bool:
    bind = op.get_bind()
    return inspect(bind).has_table(table_name, schema=schema)


def _index_exists(index_name: str, schema: str = 'public') -> bool:
    bind = op.get_bind()
    query = sa.text(
        """
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = :schema_name
          AND indexname = :index_name
        LIMIT 1
        """
    )
    return bind.execute(query, {"schema_name": schema, "index_name": index_name}).scalar() is not None


def upgrade() -> None:
    if not _table_exists('api_keys'):
        op.create_table(
            'api_keys',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('user_id', sa.UUID(), nullable=False),
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('key_hash', sa.String(length=255), nullable=False),
            sa.Column('key_prefix', sa.String(length=20), nullable=False),
            sa.Column('scopes', postgresql.ARRAY(sa.String()), nullable=False),
            sa.Column('rate_limit', sa.Integer(), nullable=False),
            sa.Column('status', sa.String(length=20), nullable=False),
            sa.Column('is_active', sa.Boolean(), nullable=False),
            sa.Column('expires_at', sa.DateTime(), nullable=True),
            sa.Column('last_used_at', sa.DateTime(), nullable=True),
            sa.Column('usage_count', sa.Integer(), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.Column('revoked_at', sa.DateTime(), nullable=True),
            sa.Column('revoked_by', sa.UUID(), nullable=True),
            sa.ForeignKeyConstraint(['revoked_by'], ['core.users.id'], name=op.f('fk_api_keys_revoked_by_users')),
            sa.ForeignKeyConstraint(['user_id'], ['core.users.id'], name=op.f('fk_api_keys_user_id_users'), ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id', name=op.f('pk_api_keys')),
            sa.UniqueConstraint('key_hash', name=op.f('uq_api_keys_key_hash'))
        )

    api_keys_idx = op.f('ix_api_keys_key_hash')
    if _table_exists('api_keys') and not _index_exists(api_keys_idx):
        op.create_index(api_keys_idx, 'api_keys', ['key_hash'], unique=True)

    if not _table_exists('developer_applications'):
        op.create_table(
            'developer_applications',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('user_id', sa.UUID(), nullable=False),
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('website_url', sa.String(length=2048), nullable=True),
            sa.Column('callback_urls', postgresql.ARRAY(sa.String()), nullable=False),
            sa.Column('app_type', sa.String(length=50), nullable=False),
            sa.Column('category', sa.String(length=100), nullable=True),
            sa.Column('status', sa.String(length=20), nullable=False),
            sa.Column('is_approved', sa.Boolean(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['core.users.id'], name=op.f('fk_developer_applications_user_id_users'), ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id', name=op.f('pk_developer_applications'))
        )

    if not _table_exists('application_api_keys'):
        op.create_table(
            'application_api_keys',
            sa.Column('application_id', sa.UUID(), nullable=True),
            sa.Column('api_key_id', sa.UUID(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['api_key_id'], ['api_keys.id'], name=op.f('fk_application_api_keys_api_key_id_api_keys'), ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['application_id'], ['developer_applications.id'], name=op.f('fk_application_api_keys_application_id_developer_applications'), ondelete='CASCADE')
        )

    if not _table_exists('webhook_event_logs'):
        op.create_table(
            'webhook_event_logs',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('event_type', webhook_event_type_enum, nullable=False),
            sa.Column('resource_type', sa.String(length=100), nullable=False),
            sa.Column('resource_id', sa.UUID(), nullable=False),
            sa.Column('event_data', sa.JSON(), nullable=False),
            sa.Column('triggered_by_user_id', sa.UUID(), nullable=True),
            sa.Column('processed', sa.Boolean(), nullable=True),
            sa.Column('webhook_count', sa.Integer(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['triggered_by_user_id'], ['core.users.id'], name=op.f('fk_webhook_event_logs_triggered_by_user_id_users')),
            sa.PrimaryKeyConstraint('id', name=op.f('pk_webhook_event_logs'))
        )

    if not _table_exists('webhooks'):
        op.create_table(
            'webhooks',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('user_id', sa.UUID(), nullable=False),
            sa.Column('url', sa.String(length=2048), nullable=False),
            sa.Column('events', sa.JSON(), nullable=False),
            sa.Column('secret', sa.String(length=255), nullable=True),
            sa.Column('active', sa.Boolean(), nullable=False),
            sa.Column('name', sa.String(length=255), nullable=True),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('last_triggered_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('total_deliveries', sa.Integer(), nullable=True),
            sa.Column('successful_deliveries', sa.Integer(), nullable=True),
            sa.Column('failed_deliveries', sa.Integer(), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['core.users.id'], name=op.f('fk_webhooks_user_id_users')),
            sa.PrimaryKeyConstraint('id', name=op.f('pk_webhooks'))
        )

    if not _table_exists('webhook_deliveries'):
        op.create_table(
            'webhook_deliveries',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('webhook_id', sa.UUID(), nullable=False),
            sa.Column('event_type', webhook_event_type_enum, nullable=False),
            sa.Column('status', webhook_status_enum, nullable=False),
            sa.Column('payload', sa.JSON(), nullable=False),
            sa.Column('response_status_code', sa.Integer(), nullable=True),
            sa.Column('response_body', sa.Text(), nullable=True),
            sa.Column('error_message', sa.Text(), nullable=True),
            sa.Column('attempt_count', sa.Integer(), nullable=True),
            sa.Column('max_retries', sa.Integer(), nullable=True),
            sa.Column('next_retry_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.Column('delivered_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['webhook_id'], ['webhooks.id'], name=op.f('fk_webhook_deliveries_webhook_id_webhooks')),
            sa.PrimaryKeyConstraint('id', name=op.f('pk_webhook_deliveries'))
        )

    if not _table_exists('api_key_usage_logs'):
        op.create_table(
            'api_key_usage_logs',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('api_key_id', sa.UUID(), nullable=False),
            sa.Column('endpoint', sa.String(length=500), nullable=False),
            sa.Column('method', sa.String(length=10), nullable=False),
            sa.Column('status_code', sa.Integer(), nullable=False),
            sa.Column('response_time_ms', sa.Integer(), nullable=True),
            sa.Column('ip_address', sa.String(length=45), nullable=True),
            sa.Column('user_agent', sa.Text(), nullable=True),
            sa.Column('request_size', sa.Integer(), nullable=True),
            sa.Column('response_size', sa.Integer(), nullable=True),
            sa.Column('error_message', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['api_key_id'], ['api_keys.id'], name=op.f('fk_api_key_usage_logs_api_key_id_api_keys'), ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id', name=op.f('pk_api_key_usage_logs'))
        )


def downgrade() -> None:
    if _table_exists('api_key_usage_logs'):
        op.drop_table('api_key_usage_logs')

    if _table_exists('webhook_deliveries'):
        op.drop_table('webhook_deliveries')

    if _table_exists('webhooks'):
        op.drop_table('webhooks')

    if _table_exists('webhook_event_logs'):
        op.drop_table('webhook_event_logs')

    if _table_exists('application_api_keys'):
        op.drop_table('application_api_keys')

    if _table_exists('developer_applications'):
        op.drop_table('developer_applications')

    api_keys_idx = op.f('ix_api_keys_key_hash')
    if _table_exists('api_keys') and _index_exists(api_keys_idx):
        op.drop_index(api_keys_idx, table_name='api_keys')

    if _table_exists('api_keys'):
        op.drop_table('api_keys')

    webhook_status_enum.drop(op.get_bind(), checkfirst=True)
    webhook_event_type_enum.drop(op.get_bind(), checkfirst=True)
