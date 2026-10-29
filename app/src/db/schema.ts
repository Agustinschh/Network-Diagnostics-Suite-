import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'devices',
      columns: [
        { name: 'ip_address', type: 'string', isIndexed: true },
        { name: 'mac_address', type: 'string', isOptional: true },
        { name: 'hostname', type: 'string', isOptional: true },
        { name: 'serial_number', type: 'string', isIndexed: true, isOptional: true },
        { name: 'vendor', type: 'string', isOptional: true },
        { name: 'model', type: 'string', isOptional: true },
        { name: 'open_ports', type: 'string' }, // JSON number[]
        { name: 'discovery_source', type: 'string' }, // 'tcp' | 'mdns' | 'snmp' | 'manual'
        { name: 'last_seen_at', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'diagnostics',
      columns: [
        { name: 'device_id', type: 'string', isIndexed: true },
        { name: 'kind', type: 'string' }, // 'snmp' | 'ssh'
        { name: 'snmp_sys_name', type: 'string', isOptional: true },
        { name: 'snmp_sys_descr', type: 'string', isOptional: true },
        { name: 'snmp_uptime_ticks', type: 'number', isOptional: true },
        { name: 'snmp_interfaces_json', type: 'string', isOptional: true },
        { name: 'ssh_profile', type: 'string', isOptional: true },
        { name: 'ssh_output', type: 'string', isOptional: true },
        { name: 'success', type: 'boolean' },
        { name: 'error_code', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number', isIndexed: true },
      ],
    }),
    tableSchema({
      name: 'installations',
      columns: [
        { name: 'device_id', type: 'string', isIndexed: true },
        { name: 'site_name', type: 'string' },
        { name: 'client_name', type: 'string' },
        { name: 'latitude', type: 'number', isOptional: true },
        { name: 'longitude', type: 'number', isOptional: true },
        { name: 'altitude', type: 'number', isOptional: true },
        { name: 'accuracy', type: 'number', isOptional: true },
        { name: 'technician_name', type: 'string' },
        { name: 'technician_notes', type: 'string' },
        { name: 'diagnostic_ids_json', type: 'string' }, // JSON string[]
        { name: 'pdf_local_path', type: 'string', isOptional: true },
        { name: 'status', type: 'string', isIndexed: true }, // 'draft' | 'finalized'
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'evidence_photos',
      columns: [
        { name: 'installation_id', type: 'string', isIndexed: true },
        { name: 'photo_local_uri', type: 'string' },
        { name: 'photo_type', type: 'string' }, // 'RACK' | 'OPTICAL_POWER' | 'SERIAL_LABEL' | 'ENVIRONMENT'
        { name: 'width', type: 'number' },
        { name: 'height', type: 'number' },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'outbox',
      columns: [
        { name: 'entity_type', type: 'string' }, // 'INSTALLATION' | 'DIAGNOSTIC'
        { name: 'entity_id', type: 'string' },
        { name: 'payload_json', type: 'string' },
        { name: 'sync_status', type: 'string', isIndexed: true }, // 'PENDING' | 'IN_PROGRESS' | 'FAILED' | 'SYNCED'
        { name: 'retry_count', type: 'number' },
        { name: 'next_attempt_at', type: 'number', isIndexed: true },
        { name: 'last_error', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'settings',
      columns: [
        { name: 'key', type: 'string', isIndexed: true },
        { name: 'value', type: 'string' },
      ],
    }),
  ],
});
