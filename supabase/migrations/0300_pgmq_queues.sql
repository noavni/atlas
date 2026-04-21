-- Atlas — 0300: pgmq queues
-- Separate queues so the drain loop can prioritise transcription (Phase 5)
-- over embedding over organize. Each queue gets a DLQ for poison messages.

select extensions.pgmq.create('embedding');
select extensions.pgmq.create('embedding_dlq');

select extensions.pgmq.create('organize');
select extensions.pgmq.create('organize_dlq');

-- Provisioned now but idle until Phase 5 (STT wiring).
select extensions.pgmq.create('transcription');
select extensions.pgmq.create('transcription_dlq');
