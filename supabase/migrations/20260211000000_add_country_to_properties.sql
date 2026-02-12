-- Add country column to properties table
alter table properties
add column if not exists country text not null default 'CA';
