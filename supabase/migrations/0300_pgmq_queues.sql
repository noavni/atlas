-- Atlas — 0300: pgmq queues
-- Separate queues so the drain loop can prioritise transcription (Phase 5)
-- over embedding over organize. Each queue gets a DLQ for poison messages.

select pgmq.create('embedding');
select pgmq.create('embedding_dlq');

select pgmq.create('organize');
select pgmq.create('organize_dlq');

-- Provisioned now but idle until Phase 5 (STT wiring).
select pgmq.create('transcription');
select pgmq.create('transcription_dlq');
