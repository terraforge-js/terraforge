import * as c from '@terraforge/core'

import * as t from '@terraforge/terraform'

type _Record<T> = Record<string, T>

export declare namespace clickhouse {
	export function install(props?: t.InstallProps): Promise<void>
	export function uninstall(props?: t.InstallProps): Promise<void>
	export function isInstalled(props?: t.InstallProps): Promise<boolean>
}

export declare function clickhouse(props: {

	/** API URL of the ClickHouse OpenAPI the provider will interact with. Alternatively, can be configured using the `CLICKHOUSE_API_URL` environment variable. Only specify if you have a specific deployment of the ClickHouse OpenAPI you want to run against. */
	apiUrl?: string,

	/** Personal API access key for a self-hosted ClickStack API, used by clickhouse_clickstack_* resources. Alternatively use the `CLICKSTACK_API_KEY` environment variable. ClickStack on ClickHouse Cloud does not accept API keys; use `clickstack_service_id` with the Cloud credentials instead. */
	clickstackApiKey?: string,

	/** Tags added to every clickhouse_clickstack_dashboard and clickhouse_clickstack_saved_search, and to every clickhouse_clickstack_alert that sets `tags`, e.g. `["terraform-managed"]`. They appear in each resource's `tags_all`, not in its own tags, and changing them updates every affected resource. An alert without `tags` copies its parent's tags, so it picks up a change to these only on its next update. Must be known at plan time. */
	clickstackDefaultTags?: Array<string>,

	/** Endpoint of a self-hosted ClickStack API used by clickhouse_clickstack_* resources, e.g. http://localhost:8000. Required together with `clickstack_api_key`. Alternatively use the `CLICKSTACK_ENDPOINT` environment variable. For ClickStack on ClickHouse Cloud, leave unset and use `clickstack_service_id` instead. */
	clickstackEndpoint?: string,

	/** ID of the ClickHouse Cloud service running managed ClickStack. When set, clickhouse_clickstack_* resources are served through the ClickHouse Cloud API, authenticating with `organization_id`, `token_key` and `token_secret`. Alternatively use the `CLICKSTACK_SERVICE_ID` environment variable. Mutually exclusive with `clickstack_api_key` and `clickstack_endpoint`. */
	clickstackServiceId?: string,

	/** ID of the organization the provider will create services under. Alternatively, can be configured using the `CLICKHOUSE_ORG_ID` environment variable. */
	organizationId?: string,

	/** Timeout in seconds for the HTTP client. */
	timeoutSeconds?: number,

	/** Token key of the key/secret pair. Used to authenticate with OpenAPI. Alternatively, can be configured using the `CLICKHOUSE_CLOUD_API_KEY` environment variable. */
	tokenKey?: string,

	/** Token secret of the key/secret pair. Used to authenticate with OpenAPI. Alternatively, can be configured using the `CLICKHOUSE_CLOUD_API_SECRET` environment variable. */
	tokenSecret?: string,
}, config?: t.TerraformProviderConfig): t.TerraformProvider

export declare namespace clickhouse {
	export namespace api {
		export type KeyInput = {

			/** Timestamp (RFC3339) when the key expires. Omit for a key that never expires. */
			expireAt?: c.OptionalInput<string>

			/** List of IP addresses/CIDRs allowed to use this key. */
			ipAccess?: c.OptionalInput<Array<c.Input<{

				/** Optional description of the entry. */
				description?: c.OptionalInput<string>

				/** IP address or CIDR. */
				source: c.Input<string>
			}>>>

			/** Name of the API key. */
			name: c.Input<string>

			/** State of the key: 'enabled' or 'disabled'. */
			state?: c.OptionalInput<string>
		}

		export type KeyOutput = Readonly<{

			/** Timestamp (RFC3339) when the key expires. Omit for a key that never expires. */
			expireAt: c.OptionalOutput<string>

			/** Unique identifier (UUID) of the API key. */
			id: c.Output<string>

			/** List of IP addresses/CIDRs allowed to use this key. */
			ipAccess: c.OptionalOutput<ReadonlyArray<Readonly<{

				/** Optional description of the entry. */
				description?: string

				/** IP address or CIDR. */
				source: string
			}>>>

			/** The generated key ID, used together with key_secret as API credentials. Returned only at creation and stored in state. Empty for imported keys. */
			keyId: c.Output<string>

			/** The generated key secret. Returned only at creation and stored in state. Empty for imported keys. */
			keySecret: c.Output<string>

			/** Last characters of the key, for identification. */
			keySuffix: c.Output<string>

			/** Name of the API key. */
			name: c.Output<string>

			/** State of the key: 'enabled' or 'disabled'. */
			state: c.Output<string>
		}>

		export class Key {

			constructor(parent: c.Group, id: string, props: KeyInput, config?:c.ResourceConfig)

				readonly [c.nodeMetaSymbol]: c.ResourceMeta

				readonly urn: c.URN


			/** Timestamp (RFC3339) when the key expires. Omit for a key that never expires. */
			readonly expireAt: c.OptionalOutput<string>

			/** Unique identifier (UUID) of the API key. */
			readonly id: c.Output<string>

			/** List of IP addresses/CIDRs allowed to use this key. */
			readonly ipAccess: c.OptionalOutput<ReadonlyArray<Readonly<{

				/** Optional description of the entry. */
				description?: string

				/** IP address or CIDR. */
				source: string
			}>>>

			/** The generated key ID, used together with key_secret as API credentials. Returned only at creation and stored in state. Empty for imported keys. */
			readonly keyId: c.Output<string>

			/** The generated key secret. Returned only at creation and stored in state. Empty for imported keys. */
			readonly keySecret: c.Output<string>

			/** Last characters of the key, for identification. */
			readonly keySuffix: c.Output<string>

			/** Name of the API key. */
			readonly name: c.Output<string>

			/** State of the key: 'enabled' or 'disabled'. */
			readonly state: c.Output<string>

		}
	}
	export namespace byoc {
		export type InfrastructureInput = {

			/** Customer cloud account to deploy into: AWS account ID, GCP project ID or Azure subscription ID. */
			accountId: c.Input<string>

			/** Availability zone suffixes (e.g. ['a', 'b', 'c']) for the ClickHouse-managed VPC. Write-only; the resolved zones are returned by the data source as 'vpc_availability_zone_list'. */
			availabilityZoneSuffixes?: c.OptionalInput<Array<c.Input<string>>>

			/** Human readable name of the infrastructure. Defaults to a server-generated name. */
			displayName?: c.OptionalInput<string>

			/** Enable private link connectivity (AWS PrivateLink, GCP Private Service Connect or Azure Private Link). */
			enablePrivateLink?: c.OptionalInput<boolean>

			/** Enable the internal (VPC-private) load balancer. */
			enablePrivateLoadBalancer?: c.OptionalInput<boolean>

			/** Enable the internet-facing load balancer. */
			enablePublicLoadBalancer?: c.OptionalInput<boolean>

			/** AWS only: ExternalID of the onboarding IAM role trust policy. Write-only; not returned by the API. */
			externalId?: c.OptionalInput<string>

			/** GCP BYO-VPC: names of the secondary ranges used for pod IPs. */
			gcpPodCidrRangeNames?: c.OptionalInput<Array<c.Input<string>>>

			/** GCP only: subnet for the Private Service Connect NAT. Only accepted together with 'enable_private_link = true'. */
			gcpPscSubnetId?: c.OptionalInput<string>

			/** GCP BYO-VPC: host project ID when the customer-managed VPC is a shared VPC. */
			gcpSharedVpcHostProjectId?: c.OptionalInput<string>

			/** BYO-VPC: private subnet IDs to deploy into. */
			privateSubnetIds?: c.OptionalInput<Array<c.Input<string>>>

			/** BYO-VPC: public subnet IDs for internet-facing load balancers. Write-only; not returned by the API. */
			publicSubnetIds?: c.OptionalInput<Array<c.Input<string>>>

			/** BYOC region to deploy into (e.g. 'us-east-1'). */
			regionId: c.Input<string>

			/** Azure only: client ID of the onboarding service principal. Write-only; not returned by the API. */
			servicePrincipalClientId?: c.OptionalInput<string>

			/** Skip the preflight cloud permission validation before creating. Defaults to false. */
			skipPreflightValidation?: c.OptionalInput<boolean>

			/** Tags to apply to the cloud resources of the infrastructure (max 50). Updates replace the full tag set. */
			tags?: c.OptionalInput<_Record<c.Input<string>>>

			/** Azure only: Entra tenant ID of the subscription. Write-only; not returned by the API. */
			tenantId?: c.OptionalInput<string>

			/** CIDR range for the ClickHouse-managed VPC. Mutually exclusive with the BYO-VPC attributes. */
			vpcCidrRange?: c.OptionalInput<string>

			/** BYO-VPC: ID of the customer-managed VPC to deploy into instead of a ClickHouse-managed one. */
			vpcId?: c.OptionalInput<string>
		}

		export type InfrastructureOutput = Readonly<{

			/** Customer cloud account to deploy into: AWS account ID, GCP project ID or Azure subscription ID. */
			accountId: c.Output<string>

			/** Availability zone suffixes (e.g. ['a', 'b', 'c']) for the ClickHouse-managed VPC. Write-only; the resolved zones are returned by the data source as 'vpc_availability_zone_list'. */
			availabilityZoneSuffixes: c.OptionalOutput<ReadonlyArray<string>>

			/** Cloud provider the infrastructure runs in ('aws', 'gcp' or 'azure'), derived from 'region_id'. */
			cloudProvider: c.Output<string>

			/** Human readable name of the infrastructure. Defaults to a server-generated name. */
			displayName: c.Output<string>

			/** Enable private link connectivity (AWS PrivateLink, GCP Private Service Connect or Azure Private Link). */
			enablePrivateLink: c.Output<boolean>

			/** Enable the internal (VPC-private) load balancer. */
			enablePrivateLoadBalancer: c.Output<boolean>

			/** Enable the internet-facing load balancer. */
			enablePublicLoadBalancer: c.Output<boolean>

			/** AWS only: ExternalID of the onboarding IAM role trust policy. Write-only; not returned by the API. */
			externalId: c.OptionalOutput<string>

			/** GCP BYO-VPC: names of the secondary ranges used for pod IPs. */
			gcpPodCidrRangeNames: c.Output<ReadonlyArray<string>>

			/** GCP only: subnet for the Private Service Connect NAT. Only accepted together with 'enable_private_link = true'. */
			gcpPscSubnetId: c.Output<string>

			/** GCP BYO-VPC: host project ID when the customer-managed VPC is a shared VPC. */
			gcpSharedVpcHostProjectId: c.Output<string>

			/** Unique ID of the BYOC infrastructure. */
			id: c.Output<string>

			/** Whether the infrastructure runs inside a customer-managed VPC. */
			isByoVpc: c.Output<boolean>

			/** BYO-VPC: private subnet IDs to deploy into. */
			privateSubnetIds: c.Output<ReadonlyArray<string>>

			/** BYO-VPC: public subnet IDs for internet-facing load balancers. Write-only; not returned by the API. */
			publicSubnetIds: c.OptionalOutput<ReadonlyArray<string>>

			/** BYOC region to deploy into (e.g. 'us-east-1'). */
			regionId: c.Output<string>

			/** Azure only: client ID of the onboarding service principal. Write-only; not returned by the API. */
			servicePrincipalClientId: c.OptionalOutput<string>

			/** Skip the preflight cloud permission validation before creating. Defaults to false. */
			skipPreflightValidation: c.OptionalOutput<boolean>

			/** Provisioning state of the infrastructure (e.g. 'infra-provisioning', 'infra-ready'). */
			state: c.Output<string>

			/** Tags to apply to the cloud resources of the infrastructure (max 50). Updates replace the full tag set. */
			tags: c.Output<Readonly<_Record<string>>>

			/** Azure only: Entra tenant ID of the subscription. Write-only; not returned by the API. */
			tenantId: c.OptionalOutput<string>

			/** CIDR range for the ClickHouse-managed VPC. Mutually exclusive with the BYO-VPC attributes. */
			vpcCidrRange: c.Output<string>

			/** BYO-VPC: ID of the customer-managed VPC to deploy into instead of a ClickHouse-managed one. */
			vpcId: c.Output<string>
		}>

		export class Infrastructure {

			constructor(parent: c.Group, id: string, props: InfrastructureInput, config?:c.ResourceConfig)

				readonly [c.nodeMetaSymbol]: c.ResourceMeta

				readonly urn: c.URN


			/** Customer cloud account to deploy into: AWS account ID, GCP project ID or Azure subscription ID. */
			readonly accountId: c.Output<string>

			/** Availability zone suffixes (e.g. ['a', 'b', 'c']) for the ClickHouse-managed VPC. Write-only; the resolved zones are returned by the data source as 'vpc_availability_zone_list'. */
			readonly availabilityZoneSuffixes: c.OptionalOutput<ReadonlyArray<string>>

			/** Cloud provider the infrastructure runs in ('aws', 'gcp' or 'azure'), derived from 'region_id'. */
			readonly cloudProvider: c.Output<string>

			/** Human readable name of the infrastructure. Defaults to a server-generated name. */
			readonly displayName: c.Output<string>

			/** Enable private link connectivity (AWS PrivateLink, GCP Private Service Connect or Azure Private Link). */
			readonly enablePrivateLink: c.Output<boolean>

			/** Enable the internal (VPC-private) load balancer. */
			readonly enablePrivateLoadBalancer: c.Output<boolean>

			/** Enable the internet-facing load balancer. */
			readonly enablePublicLoadBalancer: c.Output<boolean>

			/** AWS only: ExternalID of the onboarding IAM role trust policy. Write-only; not returned by the API. */
			readonly externalId: c.OptionalOutput<string>

			/** GCP BYO-VPC: names of the secondary ranges used for pod IPs. */
			readonly gcpPodCidrRangeNames: c.Output<ReadonlyArray<string>>

			/** GCP only: subnet for the Private Service Connect NAT. Only accepted together with 'enable_private_link = true'. */
			readonly gcpPscSubnetId: c.Output<string>

			/** GCP BYO-VPC: host project ID when the customer-managed VPC is a shared VPC. */
			readonly gcpSharedVpcHostProjectId: c.Output<string>

			/** Unique ID of the BYOC infrastructure. */
			readonly id: c.Output<string>

			/** Whether the infrastructure runs inside a customer-managed VPC. */
			readonly isByoVpc: c.Output<boolean>

			/** BYO-VPC: private subnet IDs to deploy into. */
			readonly privateSubnetIds: c.Output<ReadonlyArray<string>>

			/** BYO-VPC: public subnet IDs for internet-facing load balancers. Write-only; not returned by the API. */
			readonly publicSubnetIds: c.OptionalOutput<ReadonlyArray<string>>

			/** BYOC region to deploy into (e.g. 'us-east-1'). */
			readonly regionId: c.Output<string>

			/** Azure only: client ID of the onboarding service principal. Write-only; not returned by the API. */
			readonly servicePrincipalClientId: c.OptionalOutput<string>

			/** Skip the preflight cloud permission validation before creating. Defaults to false. */
			readonly skipPreflightValidation: c.OptionalOutput<boolean>

			/** Provisioning state of the infrastructure (e.g. 'infra-provisioning', 'infra-ready'). */
			readonly state: c.Output<string>

			/** Tags to apply to the cloud resources of the infrastructure (max 50). Updates replace the full tag set. */
			readonly tags: c.Output<Readonly<_Record<string>>>

			/** Azure only: Entra tenant ID of the subscription. Write-only; not returned by the API. */
			readonly tenantId: c.OptionalOutput<string>

			/** CIDR range for the ClickHouse-managed VPC. Mutually exclusive with the BYO-VPC attributes. */
			readonly vpcCidrRange: c.Output<string>

			/** BYO-VPC: ID of the customer-managed VPC to deploy into instead of a ClickHouse-managed one. */
			readonly vpcId: c.Output<string>

		}
	}
	export type ClickpipeInput = {
		destination: c.Input<{

			/** The list of columns for the ClickHouse table. Required for all sources except Postgres CDC (where columns are determined from source tables). */
			columns?: c.OptionalInput<Array<c.Input<{

				/** The name of the column. */
				name: c.Input<string>

				/** The type of the column. */
				type: c.Input<string>
			}>>>

			/** The name of the ClickHouse database. Default is `default`. */
			database?: c.OptionalInput<string>

			/** Whether the table is managed by ClickHouse Cloud. If `false`, the table must exist in the database. Default is `true`. **Not applicable to database/CDC pipes** (Postgres, MySQL, BigQuery, MongoDB): for those sources destination tables are always managed per-table via `table_mappings`, so this field is ignored and not sent to the API. */
			managedTable?: c.OptionalInput<boolean>

			/** ClickPipe will create a ClickHouse user with these roles. Add your custom roles here if required. */
			roles?: c.OptionalInput<Array<c.Input<string>>>

			/** The name of the ClickHouse table. Required for all sources except Postgres CDC (where tables are created from table_mappings). */
			table?: c.OptionalInput<string>
			tableDefinition?: c.OptionalInput<{
				engine: c.Input<{

					/** Column IDs to sum for SummingMergeTree engine. Required when engine type is `SummingMergeTree`. */
					columnIds?: c.OptionalInput<Array<c.Input<string>>>

					/** The type of the engine. Supported engines: `MergeTree`, `ReplacingMergeTree`, `SummingMergeTree`, `Null`. */
					type: c.Input<string>

					/** Column ID to use as version for ReplacingMergeTree engine. Required when engine type is `ReplacingMergeTree` and the pipe is being created. */
					versionColumnId?: c.OptionalInput<string>
				}>

				/** The column to partition the table by. */
				partitionBy?: c.OptionalInput<string>

				/** The primary key of the table. */
				primaryKey?: c.OptionalInput<string>

				/** The list of columns for the sorting key. Required when engine type is `ReplacingMergeTree` and the pipe is being created. */
				sortingKey?: c.OptionalInput<Array<c.Input<string>>>

				/** ClickHouse `TTL` expression applied to the destination table when ClickPipes creates it. */
				ttl?: c.OptionalInput<string>
			}>
		}>

		/** Field mapping between source and destination table. */
		fieldMappings?: c.OptionalInput<Array<c.Input<{

			/** The name of the column in destination table. */
			destinationField: c.Input<string>

			/** The name of the source field. */
			sourceField: c.Input<string>
		}>>>

		/** The name of the ClickPipe. */
		name: c.Input<string>
		scaling?: c.OptionalInput<{

			/** The CPU allocation per replica in millicores. Must be between 125 and 2000. */
			replicaCpuMillicores?: c.OptionalInput<number>

			/** The memory allocation per replica in GB. Must be between 0.5 and 8.0. */
			replicaMemoryGb?: c.OptionalInput<number>

			/** The number of desired replicas for the ClickPipe. Default is 1. The maximum value is 10. */
			replicas?: c.OptionalInput<number>
		}>

		/** The ID of the service to which the ClickPipe belongs. */
		serviceId: c.Input<string>

		/** Advanced configuration options for the ClickPipe. These settings are specific to each pipe. For the complete list of available options, see the OpenAPI documentation at https://clickhouse.com/docs/cloud/manage/api/swagger (search for the ClickPipes settings endpoint). */
		settings?: c.OptionalInput<unknown>
		source: c.Input<{
			bigquery?: c.OptionalInput<{

				/** Authentication method for the BigQuery source. (`SERVICE_ACCOUNT`, `SERVICE_ACCOUNT_WORKLOAD_IDENTITY`). `SERVICE_ACCOUNT_WORKLOAD_IDENTITY` is in Private Preview. */
				authentication?: c.OptionalInput<string>
				credentials?: c.OptionalInput<{

					/** Google Cloud service account JSON key file content, base64 encoded. */
					serviceAccountFile: c.Input<string>
				}>

				/** GCP project ID that owns the BigQuery resources. Required with SERVICE_ACCOUNT_WORKLOAD_IDENTITY authentication. */
				projectId?: c.OptionalInput<string>
				settings: c.Input<{

					/** Allow nullable columns in the destination table. */
					allowNullableColumns?: c.OptionalInput<boolean>

					/** Number of parallel workers during initial load. */
					initialLoadParallelism?: c.OptionalInput<number>

					/** Maximum amount of time one pull (query) can cover. Applies when the pipe has fallen behind, e.g. on the first CDC sync or when resuming after a pause: with a 6 hour limit, a pipe that is 3 days behind catches up in 12 smaller pulls instead of one large query. If a pull fails, only that pull is retried. Must be omitted when replication_mode is `snapshot`. Defaults to 86400 (24 hours) for CDC modes. */
					pullWindowSizeSeconds?: c.OptionalInput<number>

					/** Number of tables pulled in parallel during a CDC sync. Must be omitted when replication_mode is `snapshot`. Defaults to 4 for CDC modes. */
					queryCdcPullSyncParallelism?: c.OptionalInput<number>

					/** How changes are captured from BigQuery. (`query_based`, `events_based`). `query_based` polls each table using a watermark timestamp column (see `query_cdc_watermark_column` in `table_mappings`), `events_based` reads the BigQuery change history using the `APPENDS` or `CHANGES` table function (see `events_function` in `table_mappings`). Required when `replication_mode` is `cdc` or `cdc_only`, and must be omitted for `snapshot`. */
					replicationMethod?: c.OptionalInput<string>

					/** Replication mode for the BigQuery pipe. (`cdc`, `snapshot`, `cdc_only`) */
					replicationMode: c.Input<string>

					/** Number of rows to snapshot per partition. */
					snapshotNumRowsPerPartition?: c.OptionalInput<number>

					/** Number of parallel tables to snapshot. */
					snapshotNumberOfParallelTables?: c.OptionalInput<number>

					/** Each CDC sync reads data only up to now minus this delay, giving recently written rows time to become visible in BigQuery. Increase it if your tables are loaded via batch jobs or Google Cloud Dataflow; if set too low, late-visible rows may be skipped. Must be omitted when replication_mode is `snapshot`. Defaults to 60 for CDC modes. */
					syncDelaySeconds?: c.OptionalInput<number>

					/** Interval in seconds between CDC syncs. Must be omitted when replication_mode is `snapshot`. Defaults to 60 for CDC modes. */
					syncIntervalSeconds?: c.OptionalInput<number>
				}>

				/** GCS bucket path for staging snapshot data (e.g., gs://my-bucket/staging/). Data will be automatically cleaned up after initial load. */
				snapshotStagingPath: c.Input<string>

				/** Table mappings from BigQuery source to ClickHouse destination. */
				tableMappings: c.Input<Array<c.Input<{

					/** BigQuery table function used to read changes. (`appends`, `changes`). Required for every table when `replication_method` is `events_based`; must be omitted otherwise. */
					eventsFunction?: c.OptionalInput<string>

					/** Columns to exclude from replication. */
					excludedColumns?: c.OptionalInput<Array<c.Input<string>>>

					/** Source column of type `TIMESTAMP` used as the CDC watermark. Required for every table when `replication_method` is `query_based`; must be omitted otherwise. */
					queryCdcWatermarkColumn?: c.OptionalInput<string>

					/** Ordered list of columns to use as sorting key for the target table. Required when use_custom_sorting_key is true. */
					sortingKeys?: c.OptionalInput<Array<c.Input<string>>>

					/** Source BigQuery dataset name. */
					sourceDatasetName: c.Input<string>

					/** Source table name in BigQuery. */
					sourceTable: c.Input<string>

					/** Table engine to use for the target table. (`MergeTree`, `ReplacingMergeTree`, `Null`) */
					tableEngine?: c.OptionalInput<string>

					/** Target table name in ClickHouse. */
					targetTable: c.Input<string>

					/** Whether to use a custom sorting key for the target table. */
					useCustomSortingKey?: c.OptionalInput<boolean>
				}>>>
			}>
			kafka?: c.OptionalInput<{

				/** The authentication method for the Kafka source. (`PLAIN`, `SCRAM-SHA-256`, `SCRAM-SHA-512`, `IAM_ROLE`, `IAM_USER`, `MUTUAL_TLS`, `SERVICE_ACCOUNT_WORKLOAD_IDENTITY`). Default is `PLAIN`. `SERVICE_ACCOUNT_WORKLOAD_IDENTITY` is in Private Preview and is supported only for GCMK. */
				authentication?: c.OptionalInput<string>

				/** The list of Kafka bootstrap brokers. (comma separated) */
				brokers: c.Input<string>

				/** PEM encoded CA certificates to validate the broker's certificate. */
				caCertificate?: c.OptionalInput<string>

				/** Consumer group of the Kafka source. If not provided `clickpipes-<ID>` will be used. */
				consumerGroup?: c.OptionalInput<string>
				credentials?: c.OptionalInput<{

					/** The access key ID for the Kafka source. Use with `IAM_USER` authentication. */
					accessKeyId?: c.OptionalInput<string>

					/** PEM encoded client certificate for mTLS authentication. Use with `MUTUAL_TLS` authentication. */
					certificate?: c.OptionalInput<string>

					/** The connection string for the Kafka source. Use with `azureeventhub` Kafka source type. Use with `PLAIN` authentication. */
					connectionString?: c.OptionalInput<string>

					/** The password for the Kafka source. Use `password_wo` instead to keep the value out of state. */
					password?: c.OptionalInput<string>

					/** Write-only password for the Kafka source. Not persisted to state. Pair with `password_wo_version` to trigger updates. */
					passwordWo?: c.OptionalInput<string>

					/** Version trigger for `password_wo`. Increment to push a new password to the API. */
					passwordWoVersion?: c.OptionalInput<number>

					/** PEM encoded client private key for mTLS authentication. Use with `MUTUAL_TLS` authentication. */
					privateKey?: c.OptionalInput<string>

					/** The secret key for the Kafka source. Use with `IAM_USER` authentication. */
					secretKey?: c.OptionalInput<string>

					/** The username for the Kafka source. */
					username?: c.OptionalInput<string>
				}>

				/** Enable exactly-once delivery. Guarantees every Kafka record is inserted exactly once across restarts and rebalances. */
				exactlyOnce?: c.OptionalInput<boolean>

				/** The format of the Kafka source. (`JSONEachRow`, `Avro`, `AvroConfluent`, `Protobuf`) */
				format: c.Input<string>

				/** The IAM role for the Kafka source. Use with `IAM_ROLE` authentication. It can be used with AWS ClickHouse service only. Read more at https://clickhouse.com/docs/en/integrations/clickpipes/kafka#iam */
				iamRole?: c.OptionalInput<string>
				offset?: c.OptionalInput<{

					/** The offset strategy for the Kafka source. (`from_beginning`, `from_latest`, `from_timestamp`) */
					strategy: c.Input<string>

					/** The timestamp for the Kafka offset. Use with `from_timestamp` offset strategy. (format `2021-01-01T00:00`) */
					timestamp?: c.OptionalInput<string>
				}>

				/** Base64-encoded Protobuf schema used instead of `schema_registry`. Use `filebase64()` with a `.proto` or serialized `FileDescriptorSet` file up to 768 KiB. Requires `format = "Protobuf"` and forces replacement when changed. */
				protobufSchema?: c.OptionalInput<string>

				/** The list of reverse private endpoint IDs for the Kafka source. (comma separated) */
				reversePrivateEndpointIds?: c.OptionalInput<Array<c.Input<string>>>
				schemaRegistry?: c.OptionalInput<{

					/** The authentication method for the Schema Registry. Only supported is `PLAIN`. Required for `confluent` registries. */
					authentication?: c.OptionalInput<string>
					credentials?: c.OptionalInput<{

						/** The password for the Schema Registry. Either `password` or `password_wo` must be provided. */
						password?: c.OptionalInput<string>

						/** Write-only password for the Schema Registry. Not persisted to state. Pair with `password_wo_version`; changing schema registry credentials forces pipe replacement. */
						passwordWo?: c.OptionalInput<string>

						/** Version trigger for `password_wo`. Incrementing signals a new password, which forces pipe replacement - schema registry credentials cannot be updated in place. */
						passwordWoVersion?: c.OptionalInput<number>

						/** The username for the Schema Registry. */
						username: c.Input<string>
					}>
					glue?: c.OptionalInput<{

						/** The AWS region of the Glue schema registry. */
						region: c.Input<string>

						/** The name of the Glue schema registry. */
						registryName: c.Input<string>

						/** The IAM role to assume for Glue schema registry access. Defaults to the IAM identity of the Kafka source, so it is required unless the Kafka source uses `IAM_ROLE` or `IAM_USER` authentication. */
						roleArn?: c.OptionalInput<string>
					}>

					/** The type of the schema registry. (`confluent`, `glue`). Default is `confluent`. The AWS Glue schema registry must be enabled for the organization. */
					type?: c.OptionalInput<string>

					/** The URL of the schema registry. Required for `confluent` registries. */
					url?: c.OptionalInput<string>
				}>

				/** ID of a standalone SSH key resource (`clickhouse_clickpipes_ssh_key`) to tunnel the connection through. Mutually exclusive with inline SSH configuration. Immutable; changing it forces resource replacement. */
				sshKeyResourceId?: c.OptionalInput<string>

				/** How Kafka tombstone records are handled. Set to `delete` to delete the matching destination row using field mappings sourced from `_key` or `_key.<field>`; this requires `exactly_once = true`. Set to `soft_delete` to write a row with the `_is_deleted` virtual column set to `true`; exactly-once delivery is not required. This setting is create-only; changing it forces ClickPipe replacement. */
				tombstoneMode?: c.OptionalInput<string>

				/** One or more Kafka topics as a comma-separated string (for example, topic1,topic2). All topics must have the same schema and are ingested into the same destination table by a single ClickPipe. */
				topics: c.Input<string>

				/** The type of the Kafka source. (`kafka`, `redpanda`, `confluent`, `msk`, `warpstream`, `azureeventhub`, `gcmk`). Default is `kafka`. */
				type?: c.OptionalInput<string>
			}>
			kinesis?: c.OptionalInput<{
				accessKey?: c.OptionalInput<{

					/** The access key ID for the Kinesis source. */
					accessKeyId: c.Input<string>

					/** The secret key for the Kinesis source. */
					secretKey: c.Input<string>
				}>

				/** The authentication method for the Kinesis source. (`IAM_ROLE`, `IAM_USER`). */
				authentication: c.Input<string>

				/** The format of the Kinesis source. (`JSONEachRow`, `Avro`, `AvroConfluent`, `Protobuf`) */
				format: c.Input<string>

				/** The IAM role for the Kinesis source. Use with `IAM_ROLE` authentication. It can be used with AWS ClickHouse service only. Read more at https://clickhouse.com/docs/en/integrations/clickpipes/kinesis. */
				iamRole?: c.OptionalInput<string>

				/** The iterator type for the Kinesis source. (`TRIM_HORIZON`, `LATEST`, `AT_TIMESTAMP`) */
				iteratorType: c.Input<string>

				/** Base64-encoded Protobuf schema. Use `filebase64()` with a `.proto` or serialized `FileDescriptorSet` file up to 768 KiB. Required with `format = "Protobuf"` unless `schema_registry` is set, and not supported with other formats. Changing it forces replacement. */
				protobufSchema?: c.OptionalInput<string>

				/** The AWS region of the Kinesis stream. */
				region: c.Input<string>
				schemaRegistry?: c.OptionalInput<{

					/** The AWS region of the Glue schema registry. */
					glueRegion: c.Input<string>

					/** The name of the Glue schema registry. */
					glueRegistryName: c.Input<string>

					/** The IAM role to assume for Glue schema registry access. Defaults to the IAM identity of the Kinesis source. */
					glueRoleArn?: c.OptionalInput<string>

					/** The type of the schema registry. (`glue`) */
					type: c.Input<string>
				}>

				/** The name of the Kinesis stream. */
				streamName: c.Input<string>

				/** The timestamp for the Kinesis source. Use with `AT_TIMESTAMP` iterator type. (format `2021-01-01T00:00`) */
				timestamp?: c.OptionalInput<string>

				/** Whether to use enhanced fan-out consumer. */
				useEnhancedFanOut?: c.OptionalInput<boolean>
			}>
			mongodb?: c.OptionalInput<{

				/** PEM encoded CA certificate to validate the MongoDB server certificate. */
				caCertificate?: c.OptionalInput<string>
				credentials?: c.OptionalInput<{

					/** The password for the MongoDB instance. Use `password_wo` instead to keep the value out of state. */
					password?: c.OptionalInput<string>

					/** Write-only password for the MongoDB instance. Not persisted to state. Pair with `password_wo_version` to trigger updates. */
					passwordWo?: c.OptionalInput<string>

					/** Version trigger for `password_wo`. Increment to push a new password to the API. */
					passwordWoVersion?: c.OptionalInput<number>

					/** The username for the MongoDB instance. */
					username: c.Input<string>
				}>

				/** Disable TLS for the MongoDB connection. Defaults to false (TLS enabled). */
				disableTls?: c.OptionalInput<boolean>

				/** MongoDB read preference for replica set reads. (`primary`, `primaryPreferred`, `secondary`, `secondaryPreferred`, `nearest`) */
				readPreference: c.Input<string>
				settings: c.Input<{

					/** Enable hard delete behavior in ReplacingMergeTree for MongoDB DELETE operations. */
					deleteOnMerge?: c.OptionalInput<boolean>

					/** Number of parallel workers to use per collection during the initial snapshot phase. Can only be set at creation time; changing it forces pipe replacement. */
					initialLoadParallelism?: c.OptionalInput<number>

					/** Number of rows to pull in each batch during CDC replication. */
					pullBatchSize?: c.OptionalInput<number>

					/** Replication mode for the MongoDB pipe. (`cdc`, `snapshot`, `cdc_only`) */
					replicationMode: c.Input<string>

					/** Number of rows per partition during the snapshot phase. */
					snapshotNumRowsPerPartition?: c.OptionalInput<number>

					/** Number of collections to snapshot in parallel during the initial load phase. */
					snapshotNumberOfParallelTables?: c.OptionalInput<number>

					/** Interval in seconds to sync data from MongoDB during CDC replication. */
					syncIntervalSeconds?: c.OptionalInput<number>

					/** Store JSON values in native ClickHouse JSON format. When disabled, JSON data is stored as String. */
					useJsonNativeFormat?: c.OptionalInput<boolean>
				}>

				/** Skip certificate verification for the MongoDB connection. */
				skipCertVerification?: c.OptionalInput<boolean>

				/** ID of a standalone SSH key resource (`clickhouse_clickpipes_ssh_key`) to tunnel the connection through. Mutually exclusive with inline SSH configuration. Immutable; changing it forces resource replacement. */
				sshKeyResourceId?: c.OptionalInput<string>

				/** Collection mappings from MongoDB source to ClickHouse destination. */
				tableMappings: c.Input<Array<c.Input<{

					/** MongoDB source collection name. */
					sourceCollection: c.Input<string>

					/** MongoDB source database name. */
					sourceDatabaseName: c.Input<string>

					/** Table engine to use for the target table. (`MergeTree`, `ReplacingMergeTree`, `Null`) */
					tableEngine?: c.OptionalInput<string>

					/** ClickHouse target table name. The table will be created automatically if it does not exist. */
					targetTable: c.Input<string>
				}>>>

				/** TLS/SSL host for secure connections. */
				tlsHost?: c.OptionalInput<string>

				/** MongoDB connection URI. Supports both standard URIs (mongodb://...) and SRV URIs (mongodb+srv://...). */
				uri: c.Input<string>
			}>
			mysql?: c.OptionalInput<{

				/** Authentication method for MySQL connection. Supported values: `basic`, `IAM_ROLE`, `SERVICE_ACCOUNT_WORKLOAD_IDENTITY`. Default is `basic`. */
				authentication?: c.OptionalInput<string>

				/** PEM encoded CA certificate to validate the MySQL server certificate. */
				caCertificate?: c.OptionalInput<string>
				credentials?: c.OptionalInput<{

					/** The password for the MySQL instance. Use `password_wo` instead to keep the value out of state. */
					password?: c.OptionalInput<string>

					/** Write-only password for the MySQL instance. Not persisted to state. Pair with `password_wo_version` to trigger updates. */
					passwordWo?: c.OptionalInput<string>

					/** Version trigger for `password_wo`. Increment to push a new password to the API. */
					passwordWoVersion?: c.OptionalInput<number>

					/** The username for the MySQL instance. */
					username: c.Input<string>
				}>

				/** Disable TLS for the MySQL connection. */
				disableTls?: c.OptionalInput<boolean>

				/** The hostname of the MySQL instance. For `SERVICE_ACCOUNT_WORKLOAD_IDENTITY` authentication, use the Cloud SQL instance connection name (`project:region:instance`). */
				host: c.Input<string>

				/** IAM role ARN for IAM authentication. Required when authentication is set to `IAM_ROLE`. */
				iamRole?: c.OptionalInput<string>

				/** The port of the MySQL instance. Default is 3306. */
				port?: c.OptionalInput<number>

				/** Optional MySQL `server_id` the pipe declares itself as in the MySQL replication topology. Must be unique across replicas connected to the source. If omitted, one is assigned randomly. Must be a non-zero unsigned 32-bit integer (1 to 4294967295). */
				serverId?: c.OptionalInput<number>
				settings: c.Input<{

					/** Allow nullable columns in the destination table. */
					allowNullableColumns?: c.OptionalInput<boolean>

					/** Enable hard delete behavior in ReplacingMergeTree for MySQL DELETE operations. */
					deleteOnMerge?: c.OptionalInput<boolean>

					/** Number of parallel connections to use during initial load. */
					initialLoadParallelism?: c.OptionalInput<number>

					/** Number of rows to pull in each batch. */
					pullBatchSize?: c.OptionalInput<number>

					/** Replication mechanism for the MySQL pipe. (`GTID`, `FILE_POS`). Default is `GTID`. Mechanisms other than `GTID` (e.g. `FILE_POS`) must be enabled for your organization; contact ClickHouse support to enable this feature. */
					replicationMechanism?: c.OptionalInput<string>

					/** Replication mode for the MySQL pipe. (`cdc`, `snapshot`, `cdc_only`) */
					replicationMode: c.Input<string>

					/** Number of rows to snapshot per partition. */
					snapshotNumRowsPerPartition?: c.OptionalInput<number>

					/** Number of parallel tables to snapshot. */
					snapshotNumberOfParallelTables?: c.OptionalInput<number>

					/** Interval in seconds to sync data from MySQL. */
					syncIntervalSeconds?: c.OptionalInput<number>

					/** Enable compression for the MySQL replication connection. */
					useCompression?: c.OptionalInput<boolean>
				}>

				/** Skip certificate verification for the MySQL connection. */
				skipCertVerification?: c.OptionalInput<boolean>

				/** ID of a standalone SSH key resource (`clickhouse_clickpipes_ssh_key`) to tunnel the connection through. Mutually exclusive with inline SSH configuration. Immutable; changing it forces resource replacement. */
				sshKeyResourceId?: c.OptionalInput<string>

				/** Table mappings from MySQL source to ClickHouse destination. */
				tableMappings: c.Input<Array<c.Input<{

					/** Columns to exclude from replication. */
					excludedColumns?: c.OptionalInput<Array<c.Input<string>>>

					/** ClickHouse PARTITION BY expression applied to the destination table when ClickPipes creates it. Cannot be changed on an existing table mapping. */
					partitionByExpr?: c.OptionalInput<string>

					/** Custom partitioning column used for parallel snapshotting. Must be an indexed column of integer, date, datetime, or timestamp type. */
					partitionKey?: c.OptionalInput<string>

					/** Ordered list of columns to use as sorting key for the target table. Required when use_custom_sorting_key is true. */
					sortingKeys?: c.OptionalInput<Array<c.Input<string>>>

					/** Source schema (database) name in MySQL. */
					sourceSchemaName: c.Input<string>

					/** Source table name in MySQL. */
					sourceTable: c.Input<string>

					/** Table engine to use for the target table. (`MergeTree`, `ReplacingMergeTree`, `Null`) */
					tableEngine?: c.OptionalInput<string>

					/** Target table name in ClickHouse. */
					targetTable: c.Input<string>

					/** Whether to use a custom sorting key for the target table. */
					useCustomSortingKey?: c.OptionalInput<boolean>
				}>>>

				/** TLS/SSL host for secure connections. Used to verify the server certificate. */
				tlsHost?: c.OptionalInput<string>

				/** The type of MySQL-compatible source. (`mysql`, `rdsmysql`, `auroramysql`, `cloudsqlmysql`, `planetscalevitess`, `mariadb`, `rdsmariadb`). Default is `mysql`. */
				type?: c.OptionalInput<string>
			}>
			objectStorage?: c.OptionalInput<{
				accessKey?: c.OptionalInput<{

					/** The access key ID for the S3 source. Use with `IAM_USER` authentication. */
					accessKeyId?: c.OptionalInput<string>

					/** The secret key for the S3 source. Use with `IAM_USER` authentication. */
					secretKey?: c.OptionalInput<string>
				}>

				/** CONNECTION_STRING is for Azure Blob Storage. IAM_ROLE and IAM_USER are for AWS S3. IAM_USER, SERVICE_ACCOUNT, and the Private Preview SERVICE_ACCOUNT_WORKLOAD_IDENTITY are for GCS. If not provided, no authentication is used. */
				authentication?: c.OptionalInput<string>

				/** Container name for Azure Blob Storage. Required when type is azureblobstorage. Example: `mycontainer` */
				azureContainerName?: c.OptionalInput<string>

				/** Compression algorithm used for the files.. (`none`, `auto`, `gzip`, `brotli`, `br`, `xz`, `LZMA`, `zstd`) */
				compression?: c.OptionalInput<string>

				/** Connection string for Azure Blob Storage authentication. Required when authentication is CONNECTION_STRING. Example: `DefaultEndpointsProtocol=https;AccountName=myaccount;AccountKey=mykey;EndpointSuffix=core.windows.net` */
				connectionString?: c.OptionalInput<string>

				/** The delimiter for the S3 source. Default is `,`. */
				delimiter?: c.OptionalInput<string>

				/** The format of the S3 objects. (`JSONEachRow`, `CSV`, `CSVWithNames`, `Parquet`, `Avro`) */
				format: c.Input<string>

				/** The IAM role for the S3 source. Use with `IAM_ROLE` authentication. It can be used with AWS ClickHouse service only. Read more at https://clickhouse.com/docs/en/integrations/clickpipes/object-storage#authentication */
				iamRole?: c.OptionalInput<string>

				/** If set to true, the pipe will continuously read new files from the source. If set to false, the pipe will read the files only once. New files have to be uploaded lexically order. */
				isContinuous?: c.OptionalInput<boolean>

				/** Path to the file(s) within the Azure container. Used for Azure Blob Storage sources. You can specify multiple files using bash-like wildcards. For more information, see the documentation on using wildcards in path: https://clickhouse.com/docs/en/integrations/clickpipes/object-storage#limitations. Example: `data/logs/*.json` */
				path?: c.OptionalInput<string>

				/** Queue URL for event-based continuous ingestion. When provided, files are ingested based on event notifications rather than lexicographical order. Only applicable when `is_continuous` is `true` and authentication is provided. For S3: SQS URL in the format `https://sqs.{region}.amazonaws.com/{account-id}/{queue-name}`. For GCS: Pub/Sub subscription in the format `projects/{project}/subscriptions/{subscription}`. */
				queueUrl?: c.OptionalInput<string>

				/** Base64-encoded GCP service account JSON key for GCS authentication. Required when authentication is `SERVICE_ACCOUNT`. */
				serviceAccountKey?: c.OptionalInput<string>

				/** If set to true, skips the initial load and only ingests files delivered by queue notifications. Only applicable when `queue_url` is provided. */
				skipInitialLoad?: c.OptionalInput<boolean>

				/** Skip all files up to and including this object key during the initial load (e.g. `events/2026-06-01/`). Cannot be provided when `skip_initial_load` is true. */
				startAfter?: c.OptionalInput<string>

				/** The type of the S3-compatible source (`s3`, `gcs`, `azureblobstorage`). Default is `s3`. */
				type?: c.OptionalInput<string>

				/** The URL of the S3/GCS bucket. Required for S3 and GCS types. Not used for Azure Blob Storage (use path and azure_container_name instead). You can specify multiple files using bash-like wildcards. For more information, see the documentation on using wildcards in path: https://clickhouse.com/docs/en/integrations/clickpipes/object-storage#limitations */
				url?: c.OptionalInput<string>
			}>
			postgres?: c.OptionalInput<{

				/** Authentication method for Postgres connection. Supported values: `basic`, `IAM_ROLE`, `SERVICE_ACCOUNT_WORKLOAD_IDENTITY`. Default is `basic`. */
				authentication?: c.OptionalInput<string>

				/** PEM encoded CA certificate to validate the Postgres server certificate. */
				caCertificate?: c.OptionalInput<string>
				credentials?: c.OptionalInput<{

					/** The password for the Postgres instance. Use `password_wo` instead to keep the value out of state. */
					password?: c.OptionalInput<string>

					/** Write-only password for the Postgres instance. Not persisted to state. Pair with `password_wo_version` to trigger updates. */
					passwordWo?: c.OptionalInput<string>

					/** Version trigger for `password_wo`. Increment to push a new password to the API. */
					passwordWoVersion?: c.OptionalInput<number>

					/** The username for the Postgres instance. */
					username: c.Input<string>
				}>

				/** The database name of the Postgres instance. */
				database: c.Input<string>

				/** Disable TLS for the Postgres connection. */
				disableTls?: c.OptionalInput<boolean>

				/** The hostname of the Postgres instance. For `SERVICE_ACCOUNT_WORKLOAD_IDENTITY` authentication, use the Cloud SQL instance connection name (`project:region:instance`). */
				host: c.Input<string>

				/** IAM role ARN for IAM authentication. Required when authentication is set to `IAM_ROLE`. */
				iamRole?: c.OptionalInput<string>

				/** The port of the Postgres instance. Default is 5432. */
				port?: c.OptionalInput<number>
				settings: c.Input<{

					/** Allow nullable columns in the destination table. */
					allowNullableColumns?: c.OptionalInput<boolean>

					/** Enable hard delete behavior in ReplacingMergeTree for PostgreSQL DELETE operations. */
					deleteOnMerge?: c.OptionalInput<boolean>

					/** Enable failover for created replication slot. Requires a replication slot to NOT be set. */
					enableFailoverSlots?: c.OptionalInput<boolean>

					/** Number of parallel connections to use during initial load. */
					initialLoadParallelism?: c.OptionalInput<number>

					/** Publication name to use for replication. If not provided, ClickPipes will create one. */
					publicationName?: c.OptionalInput<string>

					/** Number of rows to pull in each batch. */
					pullBatchSize?: c.OptionalInput<number>

					/** Replication mode for the Postgres pipe. (`cdc`, `snapshot`, `cdc_only`) */
					replicationMode: c.Input<string>

					/** Replication slot name to use for replication. Only applicable when replication_mode is `cdc_only`. */
					replicationSlotName?: c.OptionalInput<string>

					/** Number of rows to snapshot per partition. */
					snapshotNumRowsPerPartition?: c.OptionalInput<number>

					/** Number of parallel tables to snapshot. */
					snapshotNumberOfParallelTables?: c.OptionalInput<number>

					/** Interval in seconds to sync data from Postgres. */
					syncIntervalSeconds?: c.OptionalInput<number>
				}>

				/** Skip certificate verification for the Postgres connection. */
				skipCertVerification?: c.OptionalInput<boolean>

				/** ID of a standalone SSH key resource (`clickhouse_clickpipes_ssh_key`) to tunnel the connection through. Mutually exclusive with inline SSH configuration. Immutable; changing it forces resource replacement. */
				sshKeyResourceId?: c.OptionalInput<string>

				/** Table mappings from Postgres source to ClickHouse destination. */
				tableMappings: c.Input<Array<c.Input<{

					/** Columns to exclude from replication. */
					excludedColumns?: c.OptionalInput<Array<c.Input<string>>>

					/** ClickHouse PARTITION BY expression applied to the destination table when ClickPipes creates it. Cannot be changed on an existing table mapping: remove the mapping in one apply, then re-add it with the new value in a subsequent apply (re-adding re-snapshots the table). */
					partitionByExpr?: c.OptionalInput<string>

					/** Custom partitioning column used for parallel snapshotting. Only beneficial for PostgreSQL 13 (no benefit for PG14+, which supports indexed ctid scans). Must be an indexed column of type: `smallint`, `integer`, `bigint`, `timestamp without time zone`, or `timestamp with time zone`. Unrelated to ClickHouse partitioning. */
					partitionKey?: c.OptionalInput<string>

					/** Ordered list of columns to use as sorting key for the target table. Required when use_custom_sorting_key is true. */
					sortingKeys?: c.OptionalInput<Array<c.Input<string>>>

					/** Source schema name in Postgres. */
					sourceSchemaName: c.Input<string>

					/** Source table name in Postgres. */
					sourceTable: c.Input<string>

					/** Table engine to use for the target table. (`MergeTree`, `ReplacingMergeTree`, `Null`) */
					tableEngine?: c.OptionalInput<string>

					/** Target table name in ClickHouse. */
					targetTable: c.Input<string>

					/** Whether to use a custom sorting key for the target table. */
					useCustomSortingKey?: c.OptionalInput<boolean>
				}>>>

				/** TLS/SSL host for secure connections. Used to verify the server certificate. */
				tlsHost?: c.OptionalInput<string>

				/** The type of the Postgres source. (`postgres`, `supabase`, `neon`, `alloydb`, `planetscale`, `rdspostgres`, `aurorapostgres`, `cloudsqlpostgres`, `azurepostgres`, `crunchybridge`, `tigerdata`). Default is `postgres`. */
				type?: c.OptionalInput<string>
			}>
			pubsub?: c.OptionalInput<{

				/** Acknowledgement deadline in seconds (10–600). */
				ackDeadline?: c.OptionalInput<number>

				/** The authentication method for the Pub/Sub source. (`SERVICE_ACCOUNT`, `SERVICE_ACCOUNT_WORKLOAD_IDENTITY`). `SERVICE_ACCOUNT_WORKLOAD_IDENTITY` is in Private Preview. */
				authentication: c.Input<string>

				/** Whether to enable ordered message delivery. Immutable — changing it requires destroy+create because ordered delivery is a property of the subscription at creation time. */
				enableOrdering?: c.OptionalInput<boolean>

				/** Optional Pub/Sub subscription filter expression (CEL). Max 256 characters. Immutable — changing it requires destroy+create because the underlying subscription filter cannot be edited in place. */
				filter?: c.OptionalInput<string>

				/** The message format of the Pub/Sub topic. (`JSONEachRow`, `Avro`, `Protobuf`) */
				format: c.Input<string>

				/** The GCP project ID that owns the Pub/Sub topic. */
				projectId: c.Input<string>

				/** RFC 3339 timestamp (e.g. `2026-04-10T12:00:00Z`). Required when `seek_type = "timestamp"`; must be omitted otherwise. */
				seekTimestamp?: c.OptionalInput<string>

				/** The starting position for consuming the subscription. (`latest`, `earliest`, `timestamp`) */
				seekType: c.Input<string>
				serviceAccountKey?: c.OptionalInput<{

					/** Base64-encoded GCP service account JSON key file contents. */
					serviceAccountFile: c.Input<string>
				}>

				/** The Pub/Sub topic name (not the fully-qualified path). */
				topic: c.Input<string>
			}>
		}>

		/** Whether the ClickPipe should be stopped. Default is `false`. For streaming and object-storage ClickPipes, set to `true` to create the pipe without starting ingestion, then set to `false` and apply to start it. Database ClickPipes cannot be created stopped. This is the configured intent; `state` reports the live status. */
		stopped?: c.OptionalInput<boolean>

		/** Set to `true` to trigger a resync operation. Only applicable for Postgres pipes. Automatically resets to `false` after the resync is triggered. **Note:** This will always show a diff in `terraform plan` after setting to `true` since it resets to `false` in state. */
		triggerResync?: c.OptionalInput<boolean>
	}

	export type ClickpipeOutput = Readonly<{
		destination: c.Output<Readonly<{

			/** The list of columns for the ClickHouse table. Required for all sources except Postgres CDC (where columns are determined from source tables). */
			columns: ReadonlyArray<Readonly<{

				/** The name of the column. */
				name: string

				/** The type of the column. */
				type: string
			}>>

			/** The name of the ClickHouse database. Default is `default`. */
			database: string

			/** Whether the table is managed by ClickHouse Cloud. If `false`, the table must exist in the database. Default is `true`. **Not applicable to database/CDC pipes** (Postgres, MySQL, BigQuery, MongoDB): for those sources destination tables are always managed per-table via `table_mappings`, so this field is ignored and not sent to the API. */
			managedTable: boolean

			/** ClickPipe will create a ClickHouse user with these roles. Add your custom roles here if required. */
			roles: ReadonlyArray<string>

			/** The name of the ClickHouse table. Required for all sources except Postgres CDC (where tables are created from table_mappings). */
			table: string
			tableDefinition: Readonly<{
				engine: Readonly<{

					/** Column IDs to sum for SummingMergeTree engine. Required when engine type is `SummingMergeTree`. */
					columnIds?: ReadonlyArray<string>

					/** The type of the engine. Supported engines: `MergeTree`, `ReplacingMergeTree`, `SummingMergeTree`, `Null`. */
					type: string

					/** Column ID to use as version for ReplacingMergeTree engine. Required when engine type is `ReplacingMergeTree` and the pipe is being created. */
					versionColumnId?: string
				}>

				/** The column to partition the table by. */
				partitionBy?: string

				/** The primary key of the table. */
				primaryKey?: string

				/** The list of columns for the sorting key. Required when engine type is `ReplacingMergeTree` and the pipe is being created. */
				sortingKey: ReadonlyArray<string>

				/** ClickHouse `TTL` expression applied to the destination table when ClickPipes creates it. */
				ttl?: string
			}>
		}>>

		/** Field mapping between source and destination table. */
		fieldMappings: c.OptionalOutput<ReadonlyArray<Readonly<{

			/** The name of the column in destination table. */
			destinationField: string

			/** The name of the source field. */
			sourceField: string
		}>>>

		/** The ID of the ClickPipe. Generated by the ClickHouse Cloud. */
		id: c.Output<string>

		/** The name of the ClickPipe. */
		name: c.Output<string>
		scaling: c.OptionalOutput<Readonly<{

			/** The CPU allocation per replica in millicores. Must be between 125 and 2000. */
			replicaCpuMillicores: number

			/** The memory allocation per replica in GB. Must be between 0.5 and 8.0. */
			replicaMemoryGb: number

			/** The number of desired replicas for the ClickPipe. Default is 1. The maximum value is 10. */
			replicas: number
		}>>

		/** The ID of the service to which the ClickPipe belongs. */
		serviceId: c.Output<string>

		/** Advanced configuration options for the ClickPipe. These settings are specific to each pipe. For the complete list of available options, see the OpenAPI documentation at https://clickhouse.com/docs/cloud/manage/api/swagger (search for the ClickPipes settings endpoint). */
		settings: c.OptionalOutput<unknown>
		source: c.Output<Readonly<{
			bigquery: Readonly<{

				/** Authentication method for the BigQuery source. (`SERVICE_ACCOUNT`, `SERVICE_ACCOUNT_WORKLOAD_IDENTITY`). `SERVICE_ACCOUNT_WORKLOAD_IDENTITY` is in Private Preview. */
				authentication: string
				credentials?: Readonly<{

					/** Google Cloud service account JSON key file content, base64 encoded. */
					serviceAccountFile: string
				}>

				/** GCP project ID that owns the BigQuery resources. Required with SERVICE_ACCOUNT_WORKLOAD_IDENTITY authentication. */
				projectId?: string
				settings: Readonly<{

					/** Allow nullable columns in the destination table. */
					allowNullableColumns: boolean

					/** Number of parallel workers during initial load. */
					initialLoadParallelism: number

					/** Maximum amount of time one pull (query) can cover. Applies when the pipe has fallen behind, e.g. on the first CDC sync or when resuming after a pause: with a 6 hour limit, a pipe that is 3 days behind catches up in 12 smaller pulls instead of one large query. If a pull fails, only that pull is retried. Must be omitted when replication_mode is `snapshot`. Defaults to 86400 (24 hours) for CDC modes. */
					pullWindowSizeSeconds: number

					/** Number of tables pulled in parallel during a CDC sync. Must be omitted when replication_mode is `snapshot`. Defaults to 4 for CDC modes. */
					queryCdcPullSyncParallelism: number

					/** How changes are captured from BigQuery. (`query_based`, `events_based`). `query_based` polls each table using a watermark timestamp column (see `query_cdc_watermark_column` in `table_mappings`), `events_based` reads the BigQuery change history using the `APPENDS` or `CHANGES` table function (see `events_function` in `table_mappings`). Required when `replication_mode` is `cdc` or `cdc_only`, and must be omitted for `snapshot`. */
					replicationMethod?: string

					/** Replication mode for the BigQuery pipe. (`cdc`, `snapshot`, `cdc_only`) */
					replicationMode: string

					/** Number of rows to snapshot per partition. */
					snapshotNumRowsPerPartition: number

					/** Number of parallel tables to snapshot. */
					snapshotNumberOfParallelTables: number

					/** Each CDC sync reads data only up to now minus this delay, giving recently written rows time to become visible in BigQuery. Increase it if your tables are loaded via batch jobs or Google Cloud Dataflow; if set too low, late-visible rows may be skipped. Must be omitted when replication_mode is `snapshot`. Defaults to 60 for CDC modes. */
					syncDelaySeconds: number

					/** Interval in seconds between CDC syncs. Must be omitted when replication_mode is `snapshot`. Defaults to 60 for CDC modes. */
					syncIntervalSeconds: number
				}>

				/** GCS bucket path for staging snapshot data (e.g., gs://my-bucket/staging/). Data will be automatically cleaned up after initial load. */
				snapshotStagingPath: string

				/** Table mappings from BigQuery source to ClickHouse destination. */
				tableMappings: ReadonlyArray<Readonly<{

					/** BigQuery table function used to read changes. (`appends`, `changes`). Required for every table when `replication_method` is `events_based`; must be omitted otherwise. */
					eventsFunction?: string

					/** Columns to exclude from replication. */
					excludedColumns: ReadonlyArray<string>

					/** Source column of type `TIMESTAMP` used as the CDC watermark. Required for every table when `replication_method` is `query_based`; must be omitted otherwise. */
					queryCdcWatermarkColumn?: string

					/** Ordered list of columns to use as sorting key for the target table. Required when use_custom_sorting_key is true. */
					sortingKeys: ReadonlyArray<string>

					/** Source BigQuery dataset name. */
					sourceDatasetName: string

					/** Source table name in BigQuery. */
					sourceTable: string

					/** Table engine to use for the target table. (`MergeTree`, `ReplacingMergeTree`, `Null`) */
					tableEngine: string

					/** Target table name in ClickHouse. */
					targetTable: string

					/** Whether to use a custom sorting key for the target table. */
					useCustomSortingKey: boolean
				}>>
			}>
			kafka: Readonly<{

				/** The authentication method for the Kafka source. (`PLAIN`, `SCRAM-SHA-256`, `SCRAM-SHA-512`, `IAM_ROLE`, `IAM_USER`, `MUTUAL_TLS`, `SERVICE_ACCOUNT_WORKLOAD_IDENTITY`). Default is `PLAIN`. `SERVICE_ACCOUNT_WORKLOAD_IDENTITY` is in Private Preview and is supported only for GCMK. */
				authentication: string

				/** The list of Kafka bootstrap brokers. (comma separated) */
				brokers: string

				/** PEM encoded CA certificates to validate the broker's certificate. */
				caCertificate?: string

				/** Consumer group of the Kafka source. If not provided `clickpipes-<ID>` will be used. */
				consumerGroup: string
				credentials?: Readonly<{

					/** The access key ID for the Kafka source. Use with `IAM_USER` authentication. */
					accessKeyId?: string

					/** PEM encoded client certificate for mTLS authentication. Use with `MUTUAL_TLS` authentication. */
					certificate?: string

					/** The connection string for the Kafka source. Use with `azureeventhub` Kafka source type. Use with `PLAIN` authentication. */
					connectionString?: string

					/** The password for the Kafka source. Use `password_wo` instead to keep the value out of state. */
					password?: string

					/** Write-only password for the Kafka source. Not persisted to state. Pair with `password_wo_version` to trigger updates. */
					passwordWo?: string

					/** Version trigger for `password_wo`. Increment to push a new password to the API. */
					passwordWoVersion?: number

					/** PEM encoded client private key for mTLS authentication. Use with `MUTUAL_TLS` authentication. */
					privateKey?: string

					/** The secret key for the Kafka source. Use with `IAM_USER` authentication. */
					secretKey?: string

					/** The username for the Kafka source. */
					username?: string
				}>

				/** Enable exactly-once delivery. Guarantees every Kafka record is inserted exactly once across restarts and rebalances. */
				exactlyOnce?: boolean

				/** The format of the Kafka source. (`JSONEachRow`, `Avro`, `AvroConfluent`, `Protobuf`) */
				format: string

				/** The IAM role for the Kafka source. Use with `IAM_ROLE` authentication. It can be used with AWS ClickHouse service only. Read more at https://clickhouse.com/docs/en/integrations/clickpipes/kafka#iam */
				iamRole?: string
				offset?: Readonly<{

					/** The offset strategy for the Kafka source. (`from_beginning`, `from_latest`, `from_timestamp`) */
					strategy: string

					/** The timestamp for the Kafka offset. Use with `from_timestamp` offset strategy. (format `2021-01-01T00:00`) */
					timestamp?: string
				}>

				/** Base64-encoded Protobuf schema used instead of `schema_registry`. Use `filebase64()` with a `.proto` or serialized `FileDescriptorSet` file up to 768 KiB. Requires `format = "Protobuf"` and forces replacement when changed. */
				protobufSchema?: string

				/** The list of reverse private endpoint IDs for the Kafka source. (comma separated) */
				reversePrivateEndpointIds?: ReadonlyArray<string>
				schemaRegistry?: Readonly<{

					/** The authentication method for the Schema Registry. Only supported is `PLAIN`. Required for `confluent` registries. */
					authentication?: string
					credentials?: Readonly<{

						/** The password for the Schema Registry. Either `password` or `password_wo` must be provided. */
						password?: string

						/** Write-only password for the Schema Registry. Not persisted to state. Pair with `password_wo_version`; changing schema registry credentials forces pipe replacement. */
						passwordWo?: string

						/** Version trigger for `password_wo`. Incrementing signals a new password, which forces pipe replacement - schema registry credentials cannot be updated in place. */
						passwordWoVersion?: number

						/** The username for the Schema Registry. */
						username: string
					}>
					glue?: Readonly<{

						/** The AWS region of the Glue schema registry. */
						region: string

						/** The name of the Glue schema registry. */
						registryName: string

						/** The IAM role to assume for Glue schema registry access. Defaults to the IAM identity of the Kafka source, so it is required unless the Kafka source uses `IAM_ROLE` or `IAM_USER` authentication. */
						roleArn?: string
					}>

					/** The type of the schema registry. (`confluent`, `glue`). Default is `confluent`. The AWS Glue schema registry must be enabled for the organization. */
					type: string

					/** The URL of the schema registry. Required for `confluent` registries. */
					url?: string
				}>

				/** ID of a standalone SSH key resource (`clickhouse_clickpipes_ssh_key`) to tunnel the connection through. Mutually exclusive with inline SSH configuration. Immutable; changing it forces resource replacement. */
				sshKeyResourceId?: string

				/** How Kafka tombstone records are handled. Set to `delete` to delete the matching destination row using field mappings sourced from `_key` or `_key.<field>`; this requires `exactly_once = true`. Set to `soft_delete` to write a row with the `_is_deleted` virtual column set to `true`; exactly-once delivery is not required. This setting is create-only; changing it forces ClickPipe replacement. */
				tombstoneMode?: string

				/** One or more Kafka topics as a comma-separated string (for example, topic1,topic2). All topics must have the same schema and are ingested into the same destination table by a single ClickPipe. */
				topics: string

				/** The type of the Kafka source. (`kafka`, `redpanda`, `confluent`, `msk`, `warpstream`, `azureeventhub`, `gcmk`). Default is `kafka`. */
				type: string
			}>
			kinesis: Readonly<{
				accessKey?: Readonly<{

					/** The access key ID for the Kinesis source. */
					accessKeyId: string

					/** The secret key for the Kinesis source. */
					secretKey: string
				}>

				/** The authentication method for the Kinesis source. (`IAM_ROLE`, `IAM_USER`). */
				authentication: string

				/** The format of the Kinesis source. (`JSONEachRow`, `Avro`, `AvroConfluent`, `Protobuf`) */
				format: string

				/** The IAM role for the Kinesis source. Use with `IAM_ROLE` authentication. It can be used with AWS ClickHouse service only. Read more at https://clickhouse.com/docs/en/integrations/clickpipes/kinesis. */
				iamRole?: string

				/** The iterator type for the Kinesis source. (`TRIM_HORIZON`, `LATEST`, `AT_TIMESTAMP`) */
				iteratorType: string

				/** Base64-encoded Protobuf schema. Use `filebase64()` with a `.proto` or serialized `FileDescriptorSet` file up to 768 KiB. Required with `format = "Protobuf"` unless `schema_registry` is set, and not supported with other formats. Changing it forces replacement. */
				protobufSchema?: string

				/** The AWS region of the Kinesis stream. */
				region: string
				schemaRegistry?: Readonly<{

					/** The AWS region of the Glue schema registry. */
					glueRegion: string

					/** The name of the Glue schema registry. */
					glueRegistryName: string

					/** The IAM role to assume for Glue schema registry access. Defaults to the IAM identity of the Kinesis source. */
					glueRoleArn?: string

					/** The type of the schema registry. (`glue`) */
					type: string
				}>

				/** The name of the Kinesis stream. */
				streamName: string

				/** The timestamp for the Kinesis source. Use with `AT_TIMESTAMP` iterator type. (format `2021-01-01T00:00`) */
				timestamp?: string

				/** Whether to use enhanced fan-out consumer. */
				useEnhancedFanOut: boolean
			}>
			mongodb: Readonly<{

				/** PEM encoded CA certificate to validate the MongoDB server certificate. */
				caCertificate?: string
				credentials?: Readonly<{

					/** The password for the MongoDB instance. Use `password_wo` instead to keep the value out of state. */
					password?: string

					/** Write-only password for the MongoDB instance. Not persisted to state. Pair with `password_wo_version` to trigger updates. */
					passwordWo?: string

					/** Version trigger for `password_wo`. Increment to push a new password to the API. */
					passwordWoVersion?: number

					/** The username for the MongoDB instance. */
					username: string
				}>

				/** Disable TLS for the MongoDB connection. Defaults to false (TLS enabled). */
				disableTls: boolean

				/** MongoDB read preference for replica set reads. (`primary`, `primaryPreferred`, `secondary`, `secondaryPreferred`, `nearest`) */
				readPreference: string
				settings: Readonly<{

					/** Enable hard delete behavior in ReplacingMergeTree for MongoDB DELETE operations. */
					deleteOnMerge: boolean

					/** Number of parallel workers to use per collection during the initial snapshot phase. Can only be set at creation time; changing it forces pipe replacement. */
					initialLoadParallelism: number

					/** Number of rows to pull in each batch during CDC replication. */
					pullBatchSize: number

					/** Replication mode for the MongoDB pipe. (`cdc`, `snapshot`, `cdc_only`) */
					replicationMode: string

					/** Number of rows per partition during the snapshot phase. */
					snapshotNumRowsPerPartition: number

					/** Number of collections to snapshot in parallel during the initial load phase. */
					snapshotNumberOfParallelTables: number

					/** Interval in seconds to sync data from MongoDB during CDC replication. */
					syncIntervalSeconds: number

					/** Store JSON values in native ClickHouse JSON format. When disabled, JSON data is stored as String. */
					useJsonNativeFormat: boolean
				}>

				/** Skip certificate verification for the MongoDB connection. */
				skipCertVerification: boolean

				/** ID of a standalone SSH key resource (`clickhouse_clickpipes_ssh_key`) to tunnel the connection through. Mutually exclusive with inline SSH configuration. Immutable; changing it forces resource replacement. */
				sshKeyResourceId?: string

				/** Collection mappings from MongoDB source to ClickHouse destination. */
				tableMappings: ReadonlyArray<Readonly<{

					/** MongoDB source collection name. */
					sourceCollection: string

					/** MongoDB source database name. */
					sourceDatabaseName: string

					/** Table engine to use for the target table. (`MergeTree`, `ReplacingMergeTree`, `Null`) */
					tableEngine?: string

					/** ClickHouse target table name. The table will be created automatically if it does not exist. */
					targetTable: string
				}>>

				/** TLS/SSL host for secure connections. */
				tlsHost?: string

				/** MongoDB connection URI. Supports both standard URIs (mongodb://...) and SRV URIs (mongodb+srv://...). */
				uri: string
			}>
			mysql: Readonly<{

				/** Authentication method for MySQL connection. Supported values: `basic`, `IAM_ROLE`, `SERVICE_ACCOUNT_WORKLOAD_IDENTITY`. Default is `basic`. */
				authentication: string

				/** PEM encoded CA certificate to validate the MySQL server certificate. */
				caCertificate?: string
				credentials?: Readonly<{

					/** The password for the MySQL instance. Use `password_wo` instead to keep the value out of state. */
					password?: string

					/** Write-only password for the MySQL instance. Not persisted to state. Pair with `password_wo_version` to trigger updates. */
					passwordWo?: string

					/** Version trigger for `password_wo`. Increment to push a new password to the API. */
					passwordWoVersion?: number

					/** The username for the MySQL instance. */
					username: string
				}>

				/** Disable TLS for the MySQL connection. */
				disableTls: boolean

				/** The hostname of the MySQL instance. For `SERVICE_ACCOUNT_WORKLOAD_IDENTITY` authentication, use the Cloud SQL instance connection name (`project:region:instance`). */
				host: string

				/** IAM role ARN for IAM authentication. Required when authentication is set to `IAM_ROLE`. */
				iamRole?: string

				/** The port of the MySQL instance. Default is 3306. */
				port: number

				/** Optional MySQL `server_id` the pipe declares itself as in the MySQL replication topology. Must be unique across replicas connected to the source. If omitted, one is assigned randomly. Must be a non-zero unsigned 32-bit integer (1 to 4294967295). */
				serverId: number
				settings: Readonly<{

					/** Allow nullable columns in the destination table. */
					allowNullableColumns: boolean

					/** Enable hard delete behavior in ReplacingMergeTree for MySQL DELETE operations. */
					deleteOnMerge: boolean

					/** Number of parallel connections to use during initial load. */
					initialLoadParallelism: number

					/** Number of rows to pull in each batch. */
					pullBatchSize: number

					/** Replication mechanism for the MySQL pipe. (`GTID`, `FILE_POS`). Default is `GTID`. Mechanisms other than `GTID` (e.g. `FILE_POS`) must be enabled for your organization; contact ClickHouse support to enable this feature. */
					replicationMechanism: string

					/** Replication mode for the MySQL pipe. (`cdc`, `snapshot`, `cdc_only`) */
					replicationMode: string

					/** Number of rows to snapshot per partition. */
					snapshotNumRowsPerPartition: number

					/** Number of parallel tables to snapshot. */
					snapshotNumberOfParallelTables: number

					/** Interval in seconds to sync data from MySQL. */
					syncIntervalSeconds: number

					/** Enable compression for the MySQL replication connection. */
					useCompression: boolean
				}>

				/** Skip certificate verification for the MySQL connection. */
				skipCertVerification: boolean

				/** ID of a standalone SSH key resource (`clickhouse_clickpipes_ssh_key`) to tunnel the connection through. Mutually exclusive with inline SSH configuration. Immutable; changing it forces resource replacement. */
				sshKeyResourceId?: string

				/** Table mappings from MySQL source to ClickHouse destination. */
				tableMappings: ReadonlyArray<Readonly<{

					/** Columns to exclude from replication. */
					excludedColumns?: ReadonlyArray<string>

					/** ClickHouse PARTITION BY expression applied to the destination table when ClickPipes creates it. Cannot be changed on an existing table mapping. */
					partitionByExpr?: string

					/** Custom partitioning column used for parallel snapshotting. Must be an indexed column of integer, date, datetime, or timestamp type. */
					partitionKey?: string

					/** Ordered list of columns to use as sorting key for the target table. Required when use_custom_sorting_key is true. */
					sortingKeys?: ReadonlyArray<string>

					/** Source schema (database) name in MySQL. */
					sourceSchemaName: string

					/** Source table name in MySQL. */
					sourceTable: string

					/** Table engine to use for the target table. (`MergeTree`, `ReplacingMergeTree`, `Null`) */
					tableEngine?: string

					/** Target table name in ClickHouse. */
					targetTable: string

					/** Whether to use a custom sorting key for the target table. */
					useCustomSortingKey: boolean
				}>>

				/** TLS/SSL host for secure connections. Used to verify the server certificate. */
				tlsHost?: string

				/** The type of MySQL-compatible source. (`mysql`, `rdsmysql`, `auroramysql`, `cloudsqlmysql`, `planetscalevitess`, `mariadb`, `rdsmariadb`). Default is `mysql`. */
				type: string
			}>
			objectStorage: Readonly<{
				accessKey?: Readonly<{

					/** The access key ID for the S3 source. Use with `IAM_USER` authentication. */
					accessKeyId?: string

					/** The secret key for the S3 source. Use with `IAM_USER` authentication. */
					secretKey?: string
				}>

				/** CONNECTION_STRING is for Azure Blob Storage. IAM_ROLE and IAM_USER are for AWS S3. IAM_USER, SERVICE_ACCOUNT, and the Private Preview SERVICE_ACCOUNT_WORKLOAD_IDENTITY are for GCS. If not provided, no authentication is used. */
				authentication?: string

				/** Container name for Azure Blob Storage. Required when type is azureblobstorage. Example: `mycontainer` */
				azureContainerName?: string

				/** Compression algorithm used for the files.. (`none`, `auto`, `gzip`, `brotli`, `br`, `xz`, `LZMA`, `zstd`) */
				compression?: string

				/** Connection string for Azure Blob Storage authentication. Required when authentication is CONNECTION_STRING. Example: `DefaultEndpointsProtocol=https;AccountName=myaccount;AccountKey=mykey;EndpointSuffix=core.windows.net` */
				connectionString?: string

				/** The delimiter for the S3 source. Default is `,`. */
				delimiter?: string

				/** The format of the S3 objects. (`JSONEachRow`, `CSV`, `CSVWithNames`, `Parquet`, `Avro`) */
				format: string

				/** The IAM role for the S3 source. Use with `IAM_ROLE` authentication. It can be used with AWS ClickHouse service only. Read more at https://clickhouse.com/docs/en/integrations/clickpipes/object-storage#authentication */
				iamRole?: string

				/** If set to true, the pipe will continuously read new files from the source. If set to false, the pipe will read the files only once. New files have to be uploaded lexically order. */
				isContinuous: boolean

				/** Path to the file(s) within the Azure container. Used for Azure Blob Storage sources. You can specify multiple files using bash-like wildcards. For more information, see the documentation on using wildcards in path: https://clickhouse.com/docs/en/integrations/clickpipes/object-storage#limitations. Example: `data/logs/*.json` */
				path?: string

				/** Queue URL for event-based continuous ingestion. When provided, files are ingested based on event notifications rather than lexicographical order. Only applicable when `is_continuous` is `true` and authentication is provided. For S3: SQS URL in the format `https://sqs.{region}.amazonaws.com/{account-id}/{queue-name}`. For GCS: Pub/Sub subscription in the format `projects/{project}/subscriptions/{subscription}`. */
				queueUrl?: string

				/** Base64-encoded GCP service account JSON key for GCS authentication. Required when authentication is `SERVICE_ACCOUNT`. */
				serviceAccountKey?: string

				/** If set to true, skips the initial load and only ingests files delivered by queue notifications. Only applicable when `queue_url` is provided. */
				skipInitialLoad?: boolean

				/** Skip all files up to and including this object key during the initial load (e.g. `events/2026-06-01/`). Cannot be provided when `skip_initial_load` is true. */
				startAfter?: string

				/** The type of the S3-compatible source (`s3`, `gcs`, `azureblobstorage`). Default is `s3`. */
				type: string

				/** The URL of the S3/GCS bucket. Required for S3 and GCS types. Not used for Azure Blob Storage (use path and azure_container_name instead). You can specify multiple files using bash-like wildcards. For more information, see the documentation on using wildcards in path: https://clickhouse.com/docs/en/integrations/clickpipes/object-storage#limitations */
				url?: string
			}>
			postgres: Readonly<{

				/** Authentication method for Postgres connection. Supported values: `basic`, `IAM_ROLE`, `SERVICE_ACCOUNT_WORKLOAD_IDENTITY`. Default is `basic`. */
				authentication: string

				/** PEM encoded CA certificate to validate the Postgres server certificate. */
				caCertificate?: string
				credentials?: Readonly<{

					/** The password for the Postgres instance. Use `password_wo` instead to keep the value out of state. */
					password?: string

					/** Write-only password for the Postgres instance. Not persisted to state. Pair with `password_wo_version` to trigger updates. */
					passwordWo?: string

					/** Version trigger for `password_wo`. Increment to push a new password to the API. */
					passwordWoVersion?: number

					/** The username for the Postgres instance. */
					username: string
				}>

				/** The database name of the Postgres instance. */
				database: string

				/** Disable TLS for the Postgres connection. */
				disableTls: boolean

				/** The hostname of the Postgres instance. For `SERVICE_ACCOUNT_WORKLOAD_IDENTITY` authentication, use the Cloud SQL instance connection name (`project:region:instance`). */
				host: string

				/** IAM role ARN for IAM authentication. Required when authentication is set to `IAM_ROLE`. */
				iamRole?: string

				/** The port of the Postgres instance. Default is 5432. */
				port: number
				settings: Readonly<{

					/** Allow nullable columns in the destination table. */
					allowNullableColumns: boolean

					/** Enable hard delete behavior in ReplacingMergeTree for PostgreSQL DELETE operations. */
					deleteOnMerge: boolean

					/** Enable failover for created replication slot. Requires a replication slot to NOT be set. */
					enableFailoverSlots: boolean

					/** Number of parallel connections to use during initial load. */
					initialLoadParallelism: number

					/** Publication name to use for replication. If not provided, ClickPipes will create one. */
					publicationName?: string

					/** Number of rows to pull in each batch. */
					pullBatchSize: number

					/** Replication mode for the Postgres pipe. (`cdc`, `snapshot`, `cdc_only`) */
					replicationMode: string

					/** Replication slot name to use for replication. Only applicable when replication_mode is `cdc_only`. */
					replicationSlotName?: string

					/** Number of rows to snapshot per partition. */
					snapshotNumRowsPerPartition: number

					/** Number of parallel tables to snapshot. */
					snapshotNumberOfParallelTables: number

					/** Interval in seconds to sync data from Postgres. */
					syncIntervalSeconds: number
				}>

				/** Skip certificate verification for the Postgres connection. */
				skipCertVerification: boolean

				/** ID of a standalone SSH key resource (`clickhouse_clickpipes_ssh_key`) to tunnel the connection through. Mutually exclusive with inline SSH configuration. Immutable; changing it forces resource replacement. */
				sshKeyResourceId?: string

				/** Table mappings from Postgres source to ClickHouse destination. */
				tableMappings: ReadonlyArray<Readonly<{

					/** Columns to exclude from replication. */
					excludedColumns?: ReadonlyArray<string>

					/** ClickHouse PARTITION BY expression applied to the destination table when ClickPipes creates it. Cannot be changed on an existing table mapping: remove the mapping in one apply, then re-add it with the new value in a subsequent apply (re-adding re-snapshots the table). */
					partitionByExpr?: string

					/** Custom partitioning column used for parallel snapshotting. Only beneficial for PostgreSQL 13 (no benefit for PG14+, which supports indexed ctid scans). Must be an indexed column of type: `smallint`, `integer`, `bigint`, `timestamp without time zone`, or `timestamp with time zone`. Unrelated to ClickHouse partitioning. */
					partitionKey?: string

					/** Ordered list of columns to use as sorting key for the target table. Required when use_custom_sorting_key is true. */
					sortingKeys?: ReadonlyArray<string>

					/** Source schema name in Postgres. */
					sourceSchemaName: string

					/** Source table name in Postgres. */
					sourceTable: string

					/** Table engine to use for the target table. (`MergeTree`, `ReplacingMergeTree`, `Null`) */
					tableEngine?: string

					/** Target table name in ClickHouse. */
					targetTable: string

					/** Whether to use a custom sorting key for the target table. */
					useCustomSortingKey: boolean
				}>>

				/** TLS/SSL host for secure connections. Used to verify the server certificate. */
				tlsHost?: string

				/** The type of the Postgres source. (`postgres`, `supabase`, `neon`, `alloydb`, `planetscale`, `rdspostgres`, `aurorapostgres`, `cloudsqlpostgres`, `azurepostgres`, `crunchybridge`, `tigerdata`). Default is `postgres`. */
				type: string
			}>
			pubsub: Readonly<{

				/** Acknowledgement deadline in seconds (10–600). */
				ackDeadline?: number

				/** The authentication method for the Pub/Sub source. (`SERVICE_ACCOUNT`, `SERVICE_ACCOUNT_WORKLOAD_IDENTITY`). `SERVICE_ACCOUNT_WORKLOAD_IDENTITY` is in Private Preview. */
				authentication: string

				/** Whether to enable ordered message delivery. Immutable — changing it requires destroy+create because ordered delivery is a property of the subscription at creation time. */
				enableOrdering?: boolean

				/** Optional Pub/Sub subscription filter expression (CEL). Max 256 characters. Immutable — changing it requires destroy+create because the underlying subscription filter cannot be edited in place. */
				filter?: string

				/** The message format of the Pub/Sub topic. (`JSONEachRow`, `Avro`, `Protobuf`) */
				format: string

				/** The GCP project ID that owns the Pub/Sub topic. */
				projectId: string

				/** RFC 3339 timestamp (e.g. `2026-04-10T12:00:00Z`). Required when `seek_type = "timestamp"`; must be omitted otherwise. */
				seekTimestamp?: string

				/** The starting position for consuming the subscription. (`latest`, `earliest`, `timestamp`) */
				seekType: string
				serviceAccountKey?: Readonly<{

					/** Base64-encoded GCP service account JSON key file contents. */
					serviceAccountFile: string
				}>

				/** The Pub/Sub topic name (not the fully-qualified path). */
				topic: string
			}>
		}>>

		/** The current state of the ClickPipe. This is a read-only field that reports the actual state from ClickHouse Cloud. Possible values include `Running`, `Stopped`, `Paused`, `Provisioning`, `Failed`, `InternalError`, etc. */
		state: c.Output<string>

		/** Whether the ClickPipe should be stopped. Default is `false`. For streaming and object-storage ClickPipes, set to `true` to create the pipe without starting ingestion, then set to `false` and apply to start it. Database ClickPipes cannot be created stopped. This is the configured intent; `state` reports the live status. */
		stopped: c.Output<boolean>

		/** Set to `true` to trigger a resync operation. Only applicable for Postgres pipes. Automatically resets to `false` after the resync is triggered. **Note:** This will always show a diff in `terraform plan` after setting to `true` since it resets to `false` in state. */
		triggerResync: c.Output<boolean>
	}>

	export class Clickpipe {

		constructor(parent: c.Group, id: string, props: ClickpipeInput, config?:c.ResourceConfig)

			readonly [c.nodeMetaSymbol]: c.ResourceMeta

			readonly urn: c.URN

		readonly destination: c.Output<Readonly<{

			/** The list of columns for the ClickHouse table. Required for all sources except Postgres CDC (where columns are determined from source tables). */
			columns: ReadonlyArray<Readonly<{

				/** The name of the column. */
				name: string

				/** The type of the column. */
				type: string
			}>>

			/** The name of the ClickHouse database. Default is `default`. */
			database: string

			/** Whether the table is managed by ClickHouse Cloud. If `false`, the table must exist in the database. Default is `true`. **Not applicable to database/CDC pipes** (Postgres, MySQL, BigQuery, MongoDB): for those sources destination tables are always managed per-table via `table_mappings`, so this field is ignored and not sent to the API. */
			managedTable: boolean

			/** ClickPipe will create a ClickHouse user with these roles. Add your custom roles here if required. */
			roles: ReadonlyArray<string>

			/** The name of the ClickHouse table. Required for all sources except Postgres CDC (where tables are created from table_mappings). */
			table: string
			tableDefinition: Readonly<{
				engine: Readonly<{

					/** Column IDs to sum for SummingMergeTree engine. Required when engine type is `SummingMergeTree`. */
					columnIds?: ReadonlyArray<string>

					/** The type of the engine. Supported engines: `MergeTree`, `ReplacingMergeTree`, `SummingMergeTree`, `Null`. */
					type: string

					/** Column ID to use as version for ReplacingMergeTree engine. Required when engine type is `ReplacingMergeTree` and the pipe is being created. */
					versionColumnId?: string
				}>

				/** The column to partition the table by. */
				partitionBy?: string

				/** The primary key of the table. */
				primaryKey?: string

				/** The list of columns for the sorting key. Required when engine type is `ReplacingMergeTree` and the pipe is being created. */
				sortingKey: ReadonlyArray<string>

				/** ClickHouse `TTL` expression applied to the destination table when ClickPipes creates it. */
				ttl?: string
			}>
		}>>

		/** Field mapping between source and destination table. */
		readonly fieldMappings: c.OptionalOutput<ReadonlyArray<Readonly<{

			/** The name of the column in destination table. */
			destinationField: string

			/** The name of the source field. */
			sourceField: string
		}>>>

		/** The ID of the ClickPipe. Generated by the ClickHouse Cloud. */
		readonly id: c.Output<string>

		/** The name of the ClickPipe. */
		readonly name: c.Output<string>
		readonly scaling: c.OptionalOutput<Readonly<{

			/** The CPU allocation per replica in millicores. Must be between 125 and 2000. */
			replicaCpuMillicores: number

			/** The memory allocation per replica in GB. Must be between 0.5 and 8.0. */
			replicaMemoryGb: number

			/** The number of desired replicas for the ClickPipe. Default is 1. The maximum value is 10. */
			replicas: number
		}>>

		/** The ID of the service to which the ClickPipe belongs. */
		readonly serviceId: c.Output<string>

		/** Advanced configuration options for the ClickPipe. These settings are specific to each pipe. For the complete list of available options, see the OpenAPI documentation at https://clickhouse.com/docs/cloud/manage/api/swagger (search for the ClickPipes settings endpoint). */
		readonly settings: c.OptionalOutput<unknown>
		readonly source: c.Output<Readonly<{
			bigquery: Readonly<{

				/** Authentication method for the BigQuery source. (`SERVICE_ACCOUNT`, `SERVICE_ACCOUNT_WORKLOAD_IDENTITY`). `SERVICE_ACCOUNT_WORKLOAD_IDENTITY` is in Private Preview. */
				authentication: string
				credentials?: Readonly<{

					/** Google Cloud service account JSON key file content, base64 encoded. */
					serviceAccountFile: string
				}>

				/** GCP project ID that owns the BigQuery resources. Required with SERVICE_ACCOUNT_WORKLOAD_IDENTITY authentication. */
				projectId?: string
				settings: Readonly<{

					/** Allow nullable columns in the destination table. */
					allowNullableColumns: boolean

					/** Number of parallel workers during initial load. */
					initialLoadParallelism: number

					/** Maximum amount of time one pull (query) can cover. Applies when the pipe has fallen behind, e.g. on the first CDC sync or when resuming after a pause: with a 6 hour limit, a pipe that is 3 days behind catches up in 12 smaller pulls instead of one large query. If a pull fails, only that pull is retried. Must be omitted when replication_mode is `snapshot`. Defaults to 86400 (24 hours) for CDC modes. */
					pullWindowSizeSeconds: number

					/** Number of tables pulled in parallel during a CDC sync. Must be omitted when replication_mode is `snapshot`. Defaults to 4 for CDC modes. */
					queryCdcPullSyncParallelism: number

					/** How changes are captured from BigQuery. (`query_based`, `events_based`). `query_based` polls each table using a watermark timestamp column (see `query_cdc_watermark_column` in `table_mappings`), `events_based` reads the BigQuery change history using the `APPENDS` or `CHANGES` table function (see `events_function` in `table_mappings`). Required when `replication_mode` is `cdc` or `cdc_only`, and must be omitted for `snapshot`. */
					replicationMethod?: string

					/** Replication mode for the BigQuery pipe. (`cdc`, `snapshot`, `cdc_only`) */
					replicationMode: string

					/** Number of rows to snapshot per partition. */
					snapshotNumRowsPerPartition: number

					/** Number of parallel tables to snapshot. */
					snapshotNumberOfParallelTables: number

					/** Each CDC sync reads data only up to now minus this delay, giving recently written rows time to become visible in BigQuery. Increase it if your tables are loaded via batch jobs or Google Cloud Dataflow; if set too low, late-visible rows may be skipped. Must be omitted when replication_mode is `snapshot`. Defaults to 60 for CDC modes. */
					syncDelaySeconds: number

					/** Interval in seconds between CDC syncs. Must be omitted when replication_mode is `snapshot`. Defaults to 60 for CDC modes. */
					syncIntervalSeconds: number
				}>

				/** GCS bucket path for staging snapshot data (e.g., gs://my-bucket/staging/). Data will be automatically cleaned up after initial load. */
				snapshotStagingPath: string

				/** Table mappings from BigQuery source to ClickHouse destination. */
				tableMappings: ReadonlyArray<Readonly<{

					/** BigQuery table function used to read changes. (`appends`, `changes`). Required for every table when `replication_method` is `events_based`; must be omitted otherwise. */
					eventsFunction?: string

					/** Columns to exclude from replication. */
					excludedColumns: ReadonlyArray<string>

					/** Source column of type `TIMESTAMP` used as the CDC watermark. Required for every table when `replication_method` is `query_based`; must be omitted otherwise. */
					queryCdcWatermarkColumn?: string

					/** Ordered list of columns to use as sorting key for the target table. Required when use_custom_sorting_key is true. */
					sortingKeys: ReadonlyArray<string>

					/** Source BigQuery dataset name. */
					sourceDatasetName: string

					/** Source table name in BigQuery. */
					sourceTable: string

					/** Table engine to use for the target table. (`MergeTree`, `ReplacingMergeTree`, `Null`) */
					tableEngine: string

					/** Target table name in ClickHouse. */
					targetTable: string

					/** Whether to use a custom sorting key for the target table. */
					useCustomSortingKey: boolean
				}>>
			}>
			kafka: Readonly<{

				/** The authentication method for the Kafka source. (`PLAIN`, `SCRAM-SHA-256`, `SCRAM-SHA-512`, `IAM_ROLE`, `IAM_USER`, `MUTUAL_TLS`, `SERVICE_ACCOUNT_WORKLOAD_IDENTITY`). Default is `PLAIN`. `SERVICE_ACCOUNT_WORKLOAD_IDENTITY` is in Private Preview and is supported only for GCMK. */
				authentication: string

				/** The list of Kafka bootstrap brokers. (comma separated) */
				brokers: string

				/** PEM encoded CA certificates to validate the broker's certificate. */
				caCertificate?: string

				/** Consumer group of the Kafka source. If not provided `clickpipes-<ID>` will be used. */
				consumerGroup: string
				credentials?: Readonly<{

					/** The access key ID for the Kafka source. Use with `IAM_USER` authentication. */
					accessKeyId?: string

					/** PEM encoded client certificate for mTLS authentication. Use with `MUTUAL_TLS` authentication. */
					certificate?: string

					/** The connection string for the Kafka source. Use with `azureeventhub` Kafka source type. Use with `PLAIN` authentication. */
					connectionString?: string

					/** The password for the Kafka source. Use `password_wo` instead to keep the value out of state. */
					password?: string

					/** Write-only password for the Kafka source. Not persisted to state. Pair with `password_wo_version` to trigger updates. */
					passwordWo?: string

					/** Version trigger for `password_wo`. Increment to push a new password to the API. */
					passwordWoVersion?: number

					/** PEM encoded client private key for mTLS authentication. Use with `MUTUAL_TLS` authentication. */
					privateKey?: string

					/** The secret key for the Kafka source. Use with `IAM_USER` authentication. */
					secretKey?: string

					/** The username for the Kafka source. */
					username?: string
				}>

				/** Enable exactly-once delivery. Guarantees every Kafka record is inserted exactly once across restarts and rebalances. */
				exactlyOnce?: boolean

				/** The format of the Kafka source. (`JSONEachRow`, `Avro`, `AvroConfluent`, `Protobuf`) */
				format: string

				/** The IAM role for the Kafka source. Use with `IAM_ROLE` authentication. It can be used with AWS ClickHouse service only. Read more at https://clickhouse.com/docs/en/integrations/clickpipes/kafka#iam */
				iamRole?: string
				offset?: Readonly<{

					/** The offset strategy for the Kafka source. (`from_beginning`, `from_latest`, `from_timestamp`) */
					strategy: string

					/** The timestamp for the Kafka offset. Use with `from_timestamp` offset strategy. (format `2021-01-01T00:00`) */
					timestamp?: string
				}>

				/** Base64-encoded Protobuf schema used instead of `schema_registry`. Use `filebase64()` with a `.proto` or serialized `FileDescriptorSet` file up to 768 KiB. Requires `format = "Protobuf"` and forces replacement when changed. */
				protobufSchema?: string

				/** The list of reverse private endpoint IDs for the Kafka source. (comma separated) */
				reversePrivateEndpointIds?: ReadonlyArray<string>
				schemaRegistry?: Readonly<{

					/** The authentication method for the Schema Registry. Only supported is `PLAIN`. Required for `confluent` registries. */
					authentication?: string
					credentials?: Readonly<{

						/** The password for the Schema Registry. Either `password` or `password_wo` must be provided. */
						password?: string

						/** Write-only password for the Schema Registry. Not persisted to state. Pair with `password_wo_version`; changing schema registry credentials forces pipe replacement. */
						passwordWo?: string

						/** Version trigger for `password_wo`. Incrementing signals a new password, which forces pipe replacement - schema registry credentials cannot be updated in place. */
						passwordWoVersion?: number

						/** The username for the Schema Registry. */
						username: string
					}>
					glue?: Readonly<{

						/** The AWS region of the Glue schema registry. */
						region: string

						/** The name of the Glue schema registry. */
						registryName: string

						/** The IAM role to assume for Glue schema registry access. Defaults to the IAM identity of the Kafka source, so it is required unless the Kafka source uses `IAM_ROLE` or `IAM_USER` authentication. */
						roleArn?: string
					}>

					/** The type of the schema registry. (`confluent`, `glue`). Default is `confluent`. The AWS Glue schema registry must be enabled for the organization. */
					type: string

					/** The URL of the schema registry. Required for `confluent` registries. */
					url?: string
				}>

				/** ID of a standalone SSH key resource (`clickhouse_clickpipes_ssh_key`) to tunnel the connection through. Mutually exclusive with inline SSH configuration. Immutable; changing it forces resource replacement. */
				sshKeyResourceId?: string

				/** How Kafka tombstone records are handled. Set to `delete` to delete the matching destination row using field mappings sourced from `_key` or `_key.<field>`; this requires `exactly_once = true`. Set to `soft_delete` to write a row with the `_is_deleted` virtual column set to `true`; exactly-once delivery is not required. This setting is create-only; changing it forces ClickPipe replacement. */
				tombstoneMode?: string

				/** One or more Kafka topics as a comma-separated string (for example, topic1,topic2). All topics must have the same schema and are ingested into the same destination table by a single ClickPipe. */
				topics: string

				/** The type of the Kafka source. (`kafka`, `redpanda`, `confluent`, `msk`, `warpstream`, `azureeventhub`, `gcmk`). Default is `kafka`. */
				type: string
			}>
			kinesis: Readonly<{
				accessKey?: Readonly<{

					/** The access key ID for the Kinesis source. */
					accessKeyId: string

					/** The secret key for the Kinesis source. */
					secretKey: string
				}>

				/** The authentication method for the Kinesis source. (`IAM_ROLE`, `IAM_USER`). */
				authentication: string

				/** The format of the Kinesis source. (`JSONEachRow`, `Avro`, `AvroConfluent`, `Protobuf`) */
				format: string

				/** The IAM role for the Kinesis source. Use with `IAM_ROLE` authentication. It can be used with AWS ClickHouse service only. Read more at https://clickhouse.com/docs/en/integrations/clickpipes/kinesis. */
				iamRole?: string

				/** The iterator type for the Kinesis source. (`TRIM_HORIZON`, `LATEST`, `AT_TIMESTAMP`) */
				iteratorType: string

				/** Base64-encoded Protobuf schema. Use `filebase64()` with a `.proto` or serialized `FileDescriptorSet` file up to 768 KiB. Required with `format = "Protobuf"` unless `schema_registry` is set, and not supported with other formats. Changing it forces replacement. */
				protobufSchema?: string

				/** The AWS region of the Kinesis stream. */
				region: string
				schemaRegistry?: Readonly<{

					/** The AWS region of the Glue schema registry. */
					glueRegion: string

					/** The name of the Glue schema registry. */
					glueRegistryName: string

					/** The IAM role to assume for Glue schema registry access. Defaults to the IAM identity of the Kinesis source. */
					glueRoleArn?: string

					/** The type of the schema registry. (`glue`) */
					type: string
				}>

				/** The name of the Kinesis stream. */
				streamName: string

				/** The timestamp for the Kinesis source. Use with `AT_TIMESTAMP` iterator type. (format `2021-01-01T00:00`) */
				timestamp?: string

				/** Whether to use enhanced fan-out consumer. */
				useEnhancedFanOut: boolean
			}>
			mongodb: Readonly<{

				/** PEM encoded CA certificate to validate the MongoDB server certificate. */
				caCertificate?: string
				credentials?: Readonly<{

					/** The password for the MongoDB instance. Use `password_wo` instead to keep the value out of state. */
					password?: string

					/** Write-only password for the MongoDB instance. Not persisted to state. Pair with `password_wo_version` to trigger updates. */
					passwordWo?: string

					/** Version trigger for `password_wo`. Increment to push a new password to the API. */
					passwordWoVersion?: number

					/** The username for the MongoDB instance. */
					username: string
				}>

				/** Disable TLS for the MongoDB connection. Defaults to false (TLS enabled). */
				disableTls: boolean

				/** MongoDB read preference for replica set reads. (`primary`, `primaryPreferred`, `secondary`, `secondaryPreferred`, `nearest`) */
				readPreference: string
				settings: Readonly<{

					/** Enable hard delete behavior in ReplacingMergeTree for MongoDB DELETE operations. */
					deleteOnMerge: boolean

					/** Number of parallel workers to use per collection during the initial snapshot phase. Can only be set at creation time; changing it forces pipe replacement. */
					initialLoadParallelism: number

					/** Number of rows to pull in each batch during CDC replication. */
					pullBatchSize: number

					/** Replication mode for the MongoDB pipe. (`cdc`, `snapshot`, `cdc_only`) */
					replicationMode: string

					/** Number of rows per partition during the snapshot phase. */
					snapshotNumRowsPerPartition: number

					/** Number of collections to snapshot in parallel during the initial load phase. */
					snapshotNumberOfParallelTables: number

					/** Interval in seconds to sync data from MongoDB during CDC replication. */
					syncIntervalSeconds: number

					/** Store JSON values in native ClickHouse JSON format. When disabled, JSON data is stored as String. */
					useJsonNativeFormat: boolean
				}>

				/** Skip certificate verification for the MongoDB connection. */
				skipCertVerification: boolean

				/** ID of a standalone SSH key resource (`clickhouse_clickpipes_ssh_key`) to tunnel the connection through. Mutually exclusive with inline SSH configuration. Immutable; changing it forces resource replacement. */
				sshKeyResourceId?: string

				/** Collection mappings from MongoDB source to ClickHouse destination. */
				tableMappings: ReadonlyArray<Readonly<{

					/** MongoDB source collection name. */
					sourceCollection: string

					/** MongoDB source database name. */
					sourceDatabaseName: string

					/** Table engine to use for the target table. (`MergeTree`, `ReplacingMergeTree`, `Null`) */
					tableEngine?: string

					/** ClickHouse target table name. The table will be created automatically if it does not exist. */
					targetTable: string
				}>>

				/** TLS/SSL host for secure connections. */
				tlsHost?: string

				/** MongoDB connection URI. Supports both standard URIs (mongodb://...) and SRV URIs (mongodb+srv://...). */
				uri: string
			}>
			mysql: Readonly<{

				/** Authentication method for MySQL connection. Supported values: `basic`, `IAM_ROLE`, `SERVICE_ACCOUNT_WORKLOAD_IDENTITY`. Default is `basic`. */
				authentication: string

				/** PEM encoded CA certificate to validate the MySQL server certificate. */
				caCertificate?: string
				credentials?: Readonly<{

					/** The password for the MySQL instance. Use `password_wo` instead to keep the value out of state. */
					password?: string

					/** Write-only password for the MySQL instance. Not persisted to state. Pair with `password_wo_version` to trigger updates. */
					passwordWo?: string

					/** Version trigger for `password_wo`. Increment to push a new password to the API. */
					passwordWoVersion?: number

					/** The username for the MySQL instance. */
					username: string
				}>

				/** Disable TLS for the MySQL connection. */
				disableTls: boolean

				/** The hostname of the MySQL instance. For `SERVICE_ACCOUNT_WORKLOAD_IDENTITY` authentication, use the Cloud SQL instance connection name (`project:region:instance`). */
				host: string

				/** IAM role ARN for IAM authentication. Required when authentication is set to `IAM_ROLE`. */
				iamRole?: string

				/** The port of the MySQL instance. Default is 3306. */
				port: number

				/** Optional MySQL `server_id` the pipe declares itself as in the MySQL replication topology. Must be unique across replicas connected to the source. If omitted, one is assigned randomly. Must be a non-zero unsigned 32-bit integer (1 to 4294967295). */
				serverId: number
				settings: Readonly<{

					/** Allow nullable columns in the destination table. */
					allowNullableColumns: boolean

					/** Enable hard delete behavior in ReplacingMergeTree for MySQL DELETE operations. */
					deleteOnMerge: boolean

					/** Number of parallel connections to use during initial load. */
					initialLoadParallelism: number

					/** Number of rows to pull in each batch. */
					pullBatchSize: number

					/** Replication mechanism for the MySQL pipe. (`GTID`, `FILE_POS`). Default is `GTID`. Mechanisms other than `GTID` (e.g. `FILE_POS`) must be enabled for your organization; contact ClickHouse support to enable this feature. */
					replicationMechanism: string

					/** Replication mode for the MySQL pipe. (`cdc`, `snapshot`, `cdc_only`) */
					replicationMode: string

					/** Number of rows to snapshot per partition. */
					snapshotNumRowsPerPartition: number

					/** Number of parallel tables to snapshot. */
					snapshotNumberOfParallelTables: number

					/** Interval in seconds to sync data from MySQL. */
					syncIntervalSeconds: number

					/** Enable compression for the MySQL replication connection. */
					useCompression: boolean
				}>

				/** Skip certificate verification for the MySQL connection. */
				skipCertVerification: boolean

				/** ID of a standalone SSH key resource (`clickhouse_clickpipes_ssh_key`) to tunnel the connection through. Mutually exclusive with inline SSH configuration. Immutable; changing it forces resource replacement. */
				sshKeyResourceId?: string

				/** Table mappings from MySQL source to ClickHouse destination. */
				tableMappings: ReadonlyArray<Readonly<{

					/** Columns to exclude from replication. */
					excludedColumns?: ReadonlyArray<string>

					/** ClickHouse PARTITION BY expression applied to the destination table when ClickPipes creates it. Cannot be changed on an existing table mapping. */
					partitionByExpr?: string

					/** Custom partitioning column used for parallel snapshotting. Must be an indexed column of integer, date, datetime, or timestamp type. */
					partitionKey?: string

					/** Ordered list of columns to use as sorting key for the target table. Required when use_custom_sorting_key is true. */
					sortingKeys?: ReadonlyArray<string>

					/** Source schema (database) name in MySQL. */
					sourceSchemaName: string

					/** Source table name in MySQL. */
					sourceTable: string

					/** Table engine to use for the target table. (`MergeTree`, `ReplacingMergeTree`, `Null`) */
					tableEngine?: string

					/** Target table name in ClickHouse. */
					targetTable: string

					/** Whether to use a custom sorting key for the target table. */
					useCustomSortingKey: boolean
				}>>

				/** TLS/SSL host for secure connections. Used to verify the server certificate. */
				tlsHost?: string

				/** The type of MySQL-compatible source. (`mysql`, `rdsmysql`, `auroramysql`, `cloudsqlmysql`, `planetscalevitess`, `mariadb`, `rdsmariadb`). Default is `mysql`. */
				type: string
			}>
			objectStorage: Readonly<{
				accessKey?: Readonly<{

					/** The access key ID for the S3 source. Use with `IAM_USER` authentication. */
					accessKeyId?: string

					/** The secret key for the S3 source. Use with `IAM_USER` authentication. */
					secretKey?: string
				}>

				/** CONNECTION_STRING is for Azure Blob Storage. IAM_ROLE and IAM_USER are for AWS S3. IAM_USER, SERVICE_ACCOUNT, and the Private Preview SERVICE_ACCOUNT_WORKLOAD_IDENTITY are for GCS. If not provided, no authentication is used. */
				authentication?: string

				/** Container name for Azure Blob Storage. Required when type is azureblobstorage. Example: `mycontainer` */
				azureContainerName?: string

				/** Compression algorithm used for the files.. (`none`, `auto`, `gzip`, `brotli`, `br`, `xz`, `LZMA`, `zstd`) */
				compression?: string

				/** Connection string for Azure Blob Storage authentication. Required when authentication is CONNECTION_STRING. Example: `DefaultEndpointsProtocol=https;AccountName=myaccount;AccountKey=mykey;EndpointSuffix=core.windows.net` */
				connectionString?: string

				/** The delimiter for the S3 source. Default is `,`. */
				delimiter?: string

				/** The format of the S3 objects. (`JSONEachRow`, `CSV`, `CSVWithNames`, `Parquet`, `Avro`) */
				format: string

				/** The IAM role for the S3 source. Use with `IAM_ROLE` authentication. It can be used with AWS ClickHouse service only. Read more at https://clickhouse.com/docs/en/integrations/clickpipes/object-storage#authentication */
				iamRole?: string

				/** If set to true, the pipe will continuously read new files from the source. If set to false, the pipe will read the files only once. New files have to be uploaded lexically order. */
				isContinuous: boolean

				/** Path to the file(s) within the Azure container. Used for Azure Blob Storage sources. You can specify multiple files using bash-like wildcards. For more information, see the documentation on using wildcards in path: https://clickhouse.com/docs/en/integrations/clickpipes/object-storage#limitations. Example: `data/logs/*.json` */
				path?: string

				/** Queue URL for event-based continuous ingestion. When provided, files are ingested based on event notifications rather than lexicographical order. Only applicable when `is_continuous` is `true` and authentication is provided. For S3: SQS URL in the format `https://sqs.{region}.amazonaws.com/{account-id}/{queue-name}`. For GCS: Pub/Sub subscription in the format `projects/{project}/subscriptions/{subscription}`. */
				queueUrl?: string

				/** Base64-encoded GCP service account JSON key for GCS authentication. Required when authentication is `SERVICE_ACCOUNT`. */
				serviceAccountKey?: string

				/** If set to true, skips the initial load and only ingests files delivered by queue notifications. Only applicable when `queue_url` is provided. */
				skipInitialLoad?: boolean

				/** Skip all files up to and including this object key during the initial load (e.g. `events/2026-06-01/`). Cannot be provided when `skip_initial_load` is true. */
				startAfter?: string

				/** The type of the S3-compatible source (`s3`, `gcs`, `azureblobstorage`). Default is `s3`. */
				type: string

				/** The URL of the S3/GCS bucket. Required for S3 and GCS types. Not used for Azure Blob Storage (use path and azure_container_name instead). You can specify multiple files using bash-like wildcards. For more information, see the documentation on using wildcards in path: https://clickhouse.com/docs/en/integrations/clickpipes/object-storage#limitations */
				url?: string
			}>
			postgres: Readonly<{

				/** Authentication method for Postgres connection. Supported values: `basic`, `IAM_ROLE`, `SERVICE_ACCOUNT_WORKLOAD_IDENTITY`. Default is `basic`. */
				authentication: string

				/** PEM encoded CA certificate to validate the Postgres server certificate. */
				caCertificate?: string
				credentials?: Readonly<{

					/** The password for the Postgres instance. Use `password_wo` instead to keep the value out of state. */
					password?: string

					/** Write-only password for the Postgres instance. Not persisted to state. Pair with `password_wo_version` to trigger updates. */
					passwordWo?: string

					/** Version trigger for `password_wo`. Increment to push a new password to the API. */
					passwordWoVersion?: number

					/** The username for the Postgres instance. */
					username: string
				}>

				/** The database name of the Postgres instance. */
				database: string

				/** Disable TLS for the Postgres connection. */
				disableTls: boolean

				/** The hostname of the Postgres instance. For `SERVICE_ACCOUNT_WORKLOAD_IDENTITY` authentication, use the Cloud SQL instance connection name (`project:region:instance`). */
				host: string

				/** IAM role ARN for IAM authentication. Required when authentication is set to `IAM_ROLE`. */
				iamRole?: string

				/** The port of the Postgres instance. Default is 5432. */
				port: number
				settings: Readonly<{

					/** Allow nullable columns in the destination table. */
					allowNullableColumns: boolean

					/** Enable hard delete behavior in ReplacingMergeTree for PostgreSQL DELETE operations. */
					deleteOnMerge: boolean

					/** Enable failover for created replication slot. Requires a replication slot to NOT be set. */
					enableFailoverSlots: boolean

					/** Number of parallel connections to use during initial load. */
					initialLoadParallelism: number

					/** Publication name to use for replication. If not provided, ClickPipes will create one. */
					publicationName?: string

					/** Number of rows to pull in each batch. */
					pullBatchSize: number

					/** Replication mode for the Postgres pipe. (`cdc`, `snapshot`, `cdc_only`) */
					replicationMode: string

					/** Replication slot name to use for replication. Only applicable when replication_mode is `cdc_only`. */
					replicationSlotName?: string

					/** Number of rows to snapshot per partition. */
					snapshotNumRowsPerPartition: number

					/** Number of parallel tables to snapshot. */
					snapshotNumberOfParallelTables: number

					/** Interval in seconds to sync data from Postgres. */
					syncIntervalSeconds: number
				}>

				/** Skip certificate verification for the Postgres connection. */
				skipCertVerification: boolean

				/** ID of a standalone SSH key resource (`clickhouse_clickpipes_ssh_key`) to tunnel the connection through. Mutually exclusive with inline SSH configuration. Immutable; changing it forces resource replacement. */
				sshKeyResourceId?: string

				/** Table mappings from Postgres source to ClickHouse destination. */
				tableMappings: ReadonlyArray<Readonly<{

					/** Columns to exclude from replication. */
					excludedColumns?: ReadonlyArray<string>

					/** ClickHouse PARTITION BY expression applied to the destination table when ClickPipes creates it. Cannot be changed on an existing table mapping: remove the mapping in one apply, then re-add it with the new value in a subsequent apply (re-adding re-snapshots the table). */
					partitionByExpr?: string

					/** Custom partitioning column used for parallel snapshotting. Only beneficial for PostgreSQL 13 (no benefit for PG14+, which supports indexed ctid scans). Must be an indexed column of type: `smallint`, `integer`, `bigint`, `timestamp without time zone`, or `timestamp with time zone`. Unrelated to ClickHouse partitioning. */
					partitionKey?: string

					/** Ordered list of columns to use as sorting key for the target table. Required when use_custom_sorting_key is true. */
					sortingKeys?: ReadonlyArray<string>

					/** Source schema name in Postgres. */
					sourceSchemaName: string

					/** Source table name in Postgres. */
					sourceTable: string

					/** Table engine to use for the target table. (`MergeTree`, `ReplacingMergeTree`, `Null`) */
					tableEngine?: string

					/** Target table name in ClickHouse. */
					targetTable: string

					/** Whether to use a custom sorting key for the target table. */
					useCustomSortingKey: boolean
				}>>

				/** TLS/SSL host for secure connections. Used to verify the server certificate. */
				tlsHost?: string

				/** The type of the Postgres source. (`postgres`, `supabase`, `neon`, `alloydb`, `planetscale`, `rdspostgres`, `aurorapostgres`, `cloudsqlpostgres`, `azurepostgres`, `crunchybridge`, `tigerdata`). Default is `postgres`. */
				type: string
			}>
			pubsub: Readonly<{

				/** Acknowledgement deadline in seconds (10–600). */
				ackDeadline?: number

				/** The authentication method for the Pub/Sub source. (`SERVICE_ACCOUNT`, `SERVICE_ACCOUNT_WORKLOAD_IDENTITY`). `SERVICE_ACCOUNT_WORKLOAD_IDENTITY` is in Private Preview. */
				authentication: string

				/** Whether to enable ordered message delivery. Immutable — changing it requires destroy+create because ordered delivery is a property of the subscription at creation time. */
				enableOrdering?: boolean

				/** Optional Pub/Sub subscription filter expression (CEL). Max 256 characters. Immutable — changing it requires destroy+create because the underlying subscription filter cannot be edited in place. */
				filter?: string

				/** The message format of the Pub/Sub topic. (`JSONEachRow`, `Avro`, `Protobuf`) */
				format: string

				/** The GCP project ID that owns the Pub/Sub topic. */
				projectId: string

				/** RFC 3339 timestamp (e.g. `2026-04-10T12:00:00Z`). Required when `seek_type = "timestamp"`; must be omitted otherwise. */
				seekTimestamp?: string

				/** The starting position for consuming the subscription. (`latest`, `earliest`, `timestamp`) */
				seekType: string
				serviceAccountKey?: Readonly<{

					/** Base64-encoded GCP service account JSON key file contents. */
					serviceAccountFile: string
				}>

				/** The Pub/Sub topic name (not the fully-qualified path). */
				topic: string
			}>
		}>>

		/** The current state of the ClickPipe. This is a read-only field that reports the actual state from ClickHouse Cloud. Possible values include `Running`, `Stopped`, `Paused`, `Provisioning`, `Failed`, `InternalError`, etc. */
		readonly state: c.Output<string>

		/** Whether the ClickPipe should be stopped. Default is `false`. For streaming and object-storage ClickPipes, set to `true` to create the pipe without starting ingestion, then set to `false` and apply to start it. Database ClickPipes cannot be created stopped. This is the configured intent; `state` reports the live status. */
		readonly stopped: c.Output<boolean>

		/** Set to `true` to trigger a resync operation. Only applicable for Postgres pipes. Automatically resets to `false` after the resync is triggered. **Note:** This will always show a diff in `terraform plan` after setting to `true` since it resets to `false` in state. */
		readonly triggerResync: c.Output<boolean>

	}
	export namespace clickpipe {
		export type CdcInfrastructureInput = {

			/** CPU in millicores for DB ClickPipes. Must be a multiple of 1000, between 1000 and 24000. */
			replicaCpuMillicores: c.Input<number>

			/** Memory in GiB for DB ClickPipes. Must be a multiple of 4, between 4 and 96. Must be 4× the CPU core count. */
			replicaMemoryGb: c.Input<number>

			/** ClickHouse Cloud service ID where the CDC infrastructure is located. */
			serviceId: c.Input<string>
		}

		export type CdcInfrastructureOutput = Readonly<{

			/** CPU in millicores for DB ClickPipes. Must be a multiple of 1000, between 1000 and 24000. */
			replicaCpuMillicores: c.Output<number>

			/** Memory in GiB for DB ClickPipes. Must be a multiple of 4, between 4 and 96. Must be 4× the CPU core count. */
			replicaMemoryGb: c.Output<number>

			/** ClickHouse Cloud service ID where the CDC infrastructure is located. */
			serviceId: c.Output<string>
		}>

		export class CdcInfrastructure {

			constructor(parent: c.Group, id: string, props: CdcInfrastructureInput, config?:c.ResourceConfig)

				readonly [c.nodeMetaSymbol]: c.ResourceMeta

				readonly urn: c.URN


			/** CPU in millicores for DB ClickPipes. Must be a multiple of 1000, between 1000 and 24000. */
			readonly replicaCpuMillicores: c.Output<number>

			/** Memory in GiB for DB ClickPipes. Must be a multiple of 4, between 4 and 96. Must be 4× the CPU core count. */
			readonly replicaMemoryGb: c.Output<number>

			/** ClickHouse Cloud service ID where the CDC infrastructure is located. */
			readonly serviceId: c.Output<string>

		}
	}
	export namespace clickpipes {
		export type ReversePrivateEndpointInput = {

			/** Description of the reverse private endpoint */
			description: c.Input<string>

			/** GCP PSC service attachment URI, required for GCP_PSC_SERVICE_ATTACHMENT type. Format: projects/{project}/regions/{region}/serviceAttachments/{name} */
			gcpServiceAttachment?: c.OptionalInput<string>

			/** MSK cluster authentication type (SASL_IAM or SASL_SCRAM), required for MSK_MULTI_VPC type */
			mskAuthentication?: c.OptionalInput<string>

			/** MSK cluster ARN, required for MSK_MULTI_VPC type */
			mskClusterArn?: c.OptionalInput<string>

			/** The ID of the ClickHouse service to associate with this reverse private endpoint */
			serviceId: c.Input<string>

			/** Type of the reverse private endpoint (VPC_ENDPOINT_SERVICE, VPC_RESOURCE, MSK_MULTI_VPC, or GCP_PSC_SERVICE_ATTACHMENT) */
			type: c.Input<string>

			/** VPC endpoint service name, required for VPC_ENDPOINT_SERVICE type */
			vpcEndpointServiceName?: c.OptionalInput<string>

			/** VPC resource configuration ID, required for VPC_RESOURCE type */
			vpcResourceConfigurationId?: c.OptionalInput<string>

			/** VPC resource share ARN, required for VPC_RESOURCE type */
			vpcResourceShareArn?: c.OptionalInput<string>
		}

		export type ReversePrivateEndpointOutput = Readonly<{

			/** Description of the reverse private endpoint */
			description: c.Output<string>

			/** Reverse private endpoint internal DNS names */
			dnsNames: c.Output<ReadonlyArray<string>>

			/** Reverse private endpoint endpoint ID */
			endpointId: c.Output<string>

			/** GCP PSC service attachment URI, required for GCP_PSC_SERVICE_ATTACHMENT type. Format: projects/{project}/regions/{region}/serviceAttachments/{name} */
			gcpServiceAttachment: c.OptionalOutput<string>

			/** Unique identifier for the reverse private endpoint */
			id: c.Output<string>

			/** MSK cluster authentication type (SASL_IAM or SASL_SCRAM), required for MSK_MULTI_VPC type */
			mskAuthentication: c.OptionalOutput<string>

			/** MSK cluster ARN, required for MSK_MULTI_VPC type */
			mskClusterArn: c.OptionalOutput<string>

			/** Reverse private endpoint private DNS names */
			privateDnsNames: c.Output<ReadonlyArray<string>>

			/** The ID of the ClickHouse service to associate with this reverse private endpoint */
			serviceId: c.Output<string>

			/** Status of the reverse private endpoint */
			status: c.Output<string>

			/** Type of the reverse private endpoint (VPC_ENDPOINT_SERVICE, VPC_RESOURCE, MSK_MULTI_VPC, or GCP_PSC_SERVICE_ATTACHMENT) */
			type: c.Output<string>

			/** VPC endpoint service name, required for VPC_ENDPOINT_SERVICE type */
			vpcEndpointServiceName: c.OptionalOutput<string>

			/** VPC resource configuration ID, required for VPC_RESOURCE type */
			vpcResourceConfigurationId: c.OptionalOutput<string>

			/** VPC resource share ARN, required for VPC_RESOURCE type */
			vpcResourceShareArn: c.OptionalOutput<string>
		}>

		export class ReversePrivateEndpoint {

			constructor(parent: c.Group, id: string, props: ReversePrivateEndpointInput, config?:c.ResourceConfig)

				readonly [c.nodeMetaSymbol]: c.ResourceMeta

				readonly urn: c.URN


			/** Description of the reverse private endpoint */
			readonly description: c.Output<string>

			/** Reverse private endpoint internal DNS names */
			readonly dnsNames: c.Output<ReadonlyArray<string>>

			/** Reverse private endpoint endpoint ID */
			readonly endpointId: c.Output<string>

			/** GCP PSC service attachment URI, required for GCP_PSC_SERVICE_ATTACHMENT type. Format: projects/{project}/regions/{region}/serviceAttachments/{name} */
			readonly gcpServiceAttachment: c.OptionalOutput<string>

			/** Unique identifier for the reverse private endpoint */
			readonly id: c.Output<string>

			/** MSK cluster authentication type (SASL_IAM or SASL_SCRAM), required for MSK_MULTI_VPC type */
			readonly mskAuthentication: c.OptionalOutput<string>

			/** MSK cluster ARN, required for MSK_MULTI_VPC type */
			readonly mskClusterArn: c.OptionalOutput<string>

			/** Reverse private endpoint private DNS names */
			readonly privateDnsNames: c.Output<ReadonlyArray<string>>

			/** The ID of the ClickHouse service to associate with this reverse private endpoint */
			readonly serviceId: c.Output<string>

			/** Status of the reverse private endpoint */
			readonly status: c.Output<string>

			/** Type of the reverse private endpoint (VPC_ENDPOINT_SERVICE, VPC_RESOURCE, MSK_MULTI_VPC, or GCP_PSC_SERVICE_ATTACHMENT) */
			readonly type: c.Output<string>

			/** VPC endpoint service name, required for VPC_ENDPOINT_SERVICE type */
			readonly vpcEndpointServiceName: c.OptionalOutput<string>

			/** VPC resource configuration ID, required for VPC_RESOURCE type */
			readonly vpcResourceConfigurationId: c.OptionalOutput<string>

			/** VPC resource share ARN, required for VPC_RESOURCE type */
			readonly vpcResourceShareArn: c.OptionalOutput<string>

		}
		export type ReversePrivateEndpointCustomPrivateDnsInput = {

			/** Full replacement list of custom private DNS mappings. Use an empty list to clear mappings. */
			mapping: c.Input<Array<c.Input<{

				/** Custom private DNS name managed by ClickHouse Cloud. */
				privateDnsName: c.Input<string>
			}>>>

			/** The ID of the ClickPipes reverse private endpoint to manage custom private DNS mappings for. */
			reversePrivateEndpointId: c.Input<string>

			/** The ID of the ClickHouse service that owns the reverse private endpoint. */
			serviceId: c.Input<string>
		}

		export type ReversePrivateEndpointCustomPrivateDnsOutput = Readonly<{

			/** Resource identifier in service_id:reverse_private_endpoint_id format. */
			id: c.Output<string>

			/** Full replacement list of custom private DNS mappings. Use an empty list to clear mappings. */
			mapping: c.Output<ReadonlyArray<Readonly<{

				/** Custom private DNS name managed by ClickHouse Cloud. */
				privateDnsName: string
			}>>>

			/** The ID of the ClickPipes reverse private endpoint to manage custom private DNS mappings for. */
			reversePrivateEndpointId: c.Output<string>

			/** The ID of the ClickHouse service that owns the reverse private endpoint. */
			serviceId: c.Output<string>
		}>

		export class ReversePrivateEndpointCustomPrivateDns {

			constructor(parent: c.Group, id: string, props: ReversePrivateEndpointCustomPrivateDnsInput, config?:c.ResourceConfig)

				readonly [c.nodeMetaSymbol]: c.ResourceMeta

				readonly urn: c.URN


			/** Resource identifier in service_id:reverse_private_endpoint_id format. */
			readonly id: c.Output<string>

			/** Full replacement list of custom private DNS mappings. Use an empty list to clear mappings. */
			readonly mapping: c.Output<ReadonlyArray<Readonly<{

				/** Custom private DNS name managed by ClickHouse Cloud. */
				privateDnsName: string
			}>>>

			/** The ID of the ClickPipes reverse private endpoint to manage custom private DNS mappings for. */
			readonly reversePrivateEndpointId: c.Output<string>

			/** The ID of the ClickHouse service that owns the reverse private endpoint. */
			readonly serviceId: c.Output<string>

		}
		export type SshKeyInput = {

			/** Description of the SSH key resource, at most 255 characters. Immutable; changing it forces resource replacement (the public API has no update operation for SSH key resources). */
			description?: c.OptionalInput<string>

			/** Hostname or IP address of the SSH bastion. Immutable; changing it forces resource replacement. */
			host: c.Input<string>

			/** Name of the SSH key resource. Unique per service and immutable; changing it forces resource replacement. */
			name: c.Input<string>

			/** Port of the SSH bastion. Defaults to 22. Immutable; changing it forces resource replacement. */
			port?: c.OptionalInput<number>

			/** The ID of the ClickHouse service this SSH key resource belongs to */
			serviceId: c.Input<string>

			/** Username to authenticate with on the SSH bastion. Immutable; changing it forces resource replacement. */
			username: c.Input<string>
		}

		export type SshKeyOutput = Readonly<{

			/** Timestamp when the SSH key resource was created. */
			createdAt: c.Output<string>

			/** Description of the SSH key resource, at most 255 characters. Immutable; changing it forces resource replacement (the public API has no update operation for SSH key resources). */
			description: c.Output<string>

			/** Hostname or IP address of the SSH bastion. Immutable; changing it forces resource replacement. */
			host: c.Output<string>

			/** Unique identifier for the SSH key resource */
			id: c.Output<string>

			/** Timestamp of the last connectivity validation, if any. */
			lastValidatedAt: c.Output<string>

			/** Name of the SSH key resource. Unique per service and immutable; changing it forces resource replacement. */
			name: c.Output<string>

			/** Port of the SSH bastion. Defaults to 22. Immutable; changing it forces resource replacement. */
			port: c.Output<number>

			/** The OpenSSH public key generated by the server. Install this in the bastion's `authorized_keys` before validating connectivity. */
			publicKey: c.Output<string>

			/** The ID of the ClickHouse service this SSH key resource belongs to */
			serviceId: c.Output<string>

			/** Validation lifecycle status of the SSH key resource (pending, active, or failed). */
			status: c.Output<string>

			/** Human-readable detail about the current status, e.g. the reason a validation failed. */
			statusMessage: c.Output<string>

			/** Timestamp when the SSH key resource was last updated. */
			updatedAt: c.Output<string>

			/** Username to authenticate with on the SSH bastion. Immutable; changing it forces resource replacement. */
			username: c.Output<string>
		}>

		export class SshKey {

			constructor(parent: c.Group, id: string, props: SshKeyInput, config?:c.ResourceConfig)

				readonly [c.nodeMetaSymbol]: c.ResourceMeta

				readonly urn: c.URN


			/** Timestamp when the SSH key resource was created. */
			readonly createdAt: c.Output<string>

			/** Description of the SSH key resource, at most 255 characters. Immutable; changing it forces resource replacement (the public API has no update operation for SSH key resources). */
			readonly description: c.Output<string>

			/** Hostname or IP address of the SSH bastion. Immutable; changing it forces resource replacement. */
			readonly host: c.Output<string>

			/** Unique identifier for the SSH key resource */
			readonly id: c.Output<string>

			/** Timestamp of the last connectivity validation, if any. */
			readonly lastValidatedAt: c.Output<string>

			/** Name of the SSH key resource. Unique per service and immutable; changing it forces resource replacement. */
			readonly name: c.Output<string>

			/** Port of the SSH bastion. Defaults to 22. Immutable; changing it forces resource replacement. */
			readonly port: c.Output<number>

			/** The OpenSSH public key generated by the server. Install this in the bastion's `authorized_keys` before validating connectivity. */
			readonly publicKey: c.Output<string>

			/** The ID of the ClickHouse service this SSH key resource belongs to */
			readonly serviceId: c.Output<string>

			/** Validation lifecycle status of the SSH key resource (pending, active, or failed). */
			readonly status: c.Output<string>

			/** Human-readable detail about the current status, e.g. the reason a validation failed. */
			readonly statusMessage: c.Output<string>

			/** Timestamp when the SSH key resource was last updated. */
			readonly updatedAt: c.Output<string>

			/** Username to authenticate with on the SSH bastion. Immutable; changing it forces resource replacement. */
			readonly username: c.Output<string>

		}
	}
	export namespace clickstack {
		export type AlertInput = {
			channel?: c.OptionalInput<{

				/** Email addresses to notify. Required when `type` is `email`. */
				emailRecipients?: c.OptionalInput<Array<c.Input<string>>>

				/** PagerDuty severity: one of `critical`, `error`, `warning`, `info`. Required when the webhook service is `pagerduty_api`. */
				severity?: c.OptionalInput<string>

				/** Slack channel ID to post to. Required when the webhook service is `slack_api`. */
				slackChannelId?: c.OptionalInput<string>

				/** Channel type: `webhook` or `email`. */
				type: c.Input<string>

				/** ID of the webhook to notify. Required when `type` is `webhook`. */
				webhookId?: c.OptionalInput<string>

				/** Service of the webhook in `webhook_id`, such as `slack_api` or `pagerduty_api`. The server always sets it from the webhook, so a configured value must match it. Setting it lets the plan check `slack_channel_id` and `severity` before apply. */
				webhookService?: c.OptionalInput<string>
			}>

			/** Notification channels for the alert, in order. Between 1 and 10 entries, no duplicates. Exactly one of `channel` or `channels` must be set. */
			channels?: c.OptionalInput<Array<c.Input<{

				/** Email addresses to notify. Required when `type` is `email`. */
				emailRecipients?: c.OptionalInput<Array<c.Input<string>>>

				/** PagerDuty severity: one of `critical`, `error`, `warning`, `info`. Required when the webhook service is `pagerduty_api`. */
				severity?: c.OptionalInput<string>

				/** Slack channel ID to post to. Required when the webhook service is `slack_api`. */
				slackChannelId?: c.OptionalInput<string>

				/** Channel type: `webhook` or `email`. */
				type: c.Input<string>

				/** ID of the webhook to notify. Required when `type` is `webhook`. */
				webhookId?: c.OptionalInput<string>

				/** Service of the webhook in `webhook_id`, such as `slack_api` or `pagerduty_api`. The server always sets it from the webhook, so a configured value must match it. Setting it lets the plan check `slack_channel_id` and `severity` before apply. */
				webhookService?: c.OptionalInput<string>
			}>>>

			/** Chart config for a standalone alert, as a JSON string in the same v2 API dialect as a tile's `config` in `dashboard_json`. Use `jsonencode(...)` or `file(...)`. Required when `source` is `inline` and rejected for the other sources. Only `line`, `stacked_bar` and `number` display types can be alerted on, as builder configs or raw SQL (`configType = "sql"`); PromQL charts cannot. A builder config also takes a chart-level `name`, `where` and `whereLanguage`, which a tile config does not. Like `dashboard_json`, this value is the sole source of truth: edits made to the alert's chart in the UI are not reported as drift. Self-hosted ClickStack only for now: the ClickHouse Cloud gateway's alert API does not list `inline` among its sources and has no chart config field, so it rejects the request. `saved_search` and `tile` alerts work on both. */
			chartConfig?: c.OptionalInput<string>

			/** ID of the dashboard that owns the tile. Required together with `tile_id` when `source` is `tile`: a tile lives inside its dashboard document, so it can only be looked up through the dashboard. Changing this forces replacement, including when the dashboard itself is replaced: the server deletes a dashboard's tile alerts along with it, so the alert cannot outlive the dashboard it points at. */
			dashboardId?: c.OptionalInput<string>

			/** Optional expression to evaluate the alert per group (saved-search alerts only). Sticky once set: the API keeps the previous value when the field is omitted and cannot clear it, so removing it from config is a no-op (recreate the alert to fully reset it). */
			groupBy?: c.OptionalInput<string>

			/** Evaluation window: one of `1m`, `5m`, `15m`, `30m`, `1h`, `6h`, `12h`, `1d`. */
			interval: c.Input<string>

			/** Optional notification message template (1-4096 characters). */
			message?: c.OptionalInput<string>

			/** Optional alert name (1-512 characters). */
			name?: c.OptionalInput<string>

			/** Optional markdown note (1-4096 characters). */
			note?: c.OptionalInput<string>

			/** Fire only after the condition holds for this many consecutive windows (>= 1). */
			numConsecutiveWindows?: c.OptionalInput<number>

			/** ID of the saved search this alert evaluates. Required when `source` is `saved_search`. */
			savedSearchId?: c.OptionalInput<string>

			/** Offset window boundaries by this many minutes (0-1439, and less than the interval). Mutually exclusive with `schedule_start_at`; setting one clears the other. */
			scheduleOffsetMinutes?: c.OptionalInput<number>

			/** Absolute UTC anchor (RFC3339) for window alignment. Mutually exclusive with a non-zero `schedule_offset_minutes`; setting one clears the other. */
			scheduleStartAt?: c.OptionalInput<string>

			/** What the alert evaluates: `saved_search` (default, requires `saved_search_id`), `tile` (requires `dashboard_id` and `tile_id`), or `inline` (requires `chart_config`). Changing this forces replacement. */
			source?: c.OptionalInput<string>

			/** Tags for the alert (up to 50, each at most 32 characters). Requires ClickStack API 2.38.0 or later. When unset, the server copies the saved search or dashboard tags, provider default tags included, each time the alert is written, and Terraform does not track them. Set `[]` for no tags of its own; provider default tags still apply. */
			tags?: c.OptionalInput<Array<c.Input<string>>>

			/** Team ID to manage this alert under (`x-hdx-team`). Changing this forces the alert to be replaced. */
			team?: c.OptionalInput<string>

			/** Threshold value the alert compares against. For range types (`between`/`not_between`) this is the lower bound. */
			threshold: c.Input<number>

			/** Upper bound, required for `between`/`not_between` and ignored otherwise. Must be >= `threshold`. */
			thresholdMax?: c.OptionalInput<number>

			/** Comparison type: one of `above`, `below`, `above_exclusive`, `below_or_equal`, `equal`, `not_equal`, `between`, `not_between`. */
			thresholdType: c.Input<string>

			/** Server-assigned ID of the tile to alert on. Take it from the dashboard's `tile_ids` map by tile name; ids cannot be chosen in `dashboard_json`. Required together with `dashboard_id` when `source` is `tile`. The alert has no query of its own: the server reads the tile's chart config from the dashboard on every evaluation. The tile must be a line, stacked bar, or number tile. Changing this to a different known value forces replacement. */
			tileId?: c.OptionalInput<string>
		}

		export type AlertOutput = Readonly<{
			channel: c.OptionalOutput<Readonly<{

				/** Email addresses to notify. Required when `type` is `email`. */
				emailRecipients: ReadonlyArray<string>

				/** PagerDuty severity: one of `critical`, `error`, `warning`, `info`. Required when the webhook service is `pagerduty_api`. */
				severity: string

				/** Slack channel ID to post to. Required when the webhook service is `slack_api`. */
				slackChannelId: string

				/** Channel type: `webhook` or `email`. */
				type: string

				/** ID of the webhook to notify. Required when `type` is `webhook`. */
				webhookId: string

				/** Service of the webhook in `webhook_id`, such as `slack_api` or `pagerduty_api`. The server always sets it from the webhook, so a configured value must match it. Setting it lets the plan check `slack_channel_id` and `severity` before apply. */
				webhookService: string
			}>>

			/** Notification channels for the alert, in order. Between 1 and 10 entries, no duplicates. Exactly one of `channel` or `channels` must be set. */
			channels: c.OptionalOutput<ReadonlyArray<Readonly<{

				/** Email addresses to notify. Required when `type` is `email`. */
				emailRecipients?: ReadonlyArray<string>

				/** PagerDuty severity: one of `critical`, `error`, `warning`, `info`. Required when the webhook service is `pagerduty_api`. */
				severity?: string

				/** Slack channel ID to post to. Required when the webhook service is `slack_api`. */
				slackChannelId?: string

				/** Channel type: `webhook` or `email`. */
				type: string

				/** ID of the webhook to notify. Required when `type` is `webhook`. */
				webhookId?: string

				/** Service of the webhook in `webhook_id`, such as `slack_api` or `pagerduty_api`. The server always sets it from the webhook, so a configured value must match it. Setting it lets the plan check `slack_channel_id` and `severity` before apply. */
				webhookService: string
			}>>>

			/** Chart config for a standalone alert, as a JSON string in the same v2 API dialect as a tile's `config` in `dashboard_json`. Use `jsonencode(...)` or `file(...)`. Required when `source` is `inline` and rejected for the other sources. Only `line`, `stacked_bar` and `number` display types can be alerted on, as builder configs or raw SQL (`configType = "sql"`); PromQL charts cannot. A builder config also takes a chart-level `name`, `where` and `whereLanguage`, which a tile config does not. Like `dashboard_json`, this value is the sole source of truth: edits made to the alert's chart in the UI are not reported as drift. Self-hosted ClickStack only for now: the ClickHouse Cloud gateway's alert API does not list `inline` among its sources and has no chart config field, so it rejects the request. `saved_search` and `tile` alerts work on both. */
			chartConfig: c.OptionalOutput<string>

			/** ID of the dashboard that owns the tile. Required together with `tile_id` when `source` is `tile`: a tile lives inside its dashboard document, so it can only be looked up through the dashboard. Changing this forces replacement, including when the dashboard itself is replaced: the server deletes a dashboard's tile alerts along with it, so the alert cannot outlive the dashboard it points at. */
			dashboardId: c.OptionalOutput<string>

			/** Optional expression to evaluate the alert per group (saved-search alerts only). Sticky once set: the API keeps the previous value when the field is omitted and cannot clear it, so removing it from config is a no-op (recreate the alert to fully reset it). */
			groupBy: c.Output<string>

			/** Identifier of the alert. */
			id: c.Output<string>

			/** Evaluation window: one of `1m`, `5m`, `15m`, `30m`, `1h`, `6h`, `12h`, `1d`. */
			interval: c.Output<string>

			/** Optional notification message template (1-4096 characters). */
			message: c.OptionalOutput<string>

			/** Optional alert name (1-512 characters). */
			name: c.OptionalOutput<string>

			/** Optional markdown note (1-4096 characters). */
			note: c.OptionalOutput<string>

			/** Fire only after the condition holds for this many consecutive windows (>= 1). */
			numConsecutiveWindows: c.OptionalOutput<number>

			/** ID of the saved search this alert evaluates. Required when `source` is `saved_search`. */
			savedSearchId: c.OptionalOutput<string>

			/** Offset window boundaries by this many minutes (0-1439, and less than the interval). Mutually exclusive with `schedule_start_at`; setting one clears the other. */
			scheduleOffsetMinutes: c.OptionalOutput<number>

			/** Absolute UTC anchor (RFC3339) for window alignment. Mutually exclusive with a non-zero `schedule_offset_minutes`; setting one clears the other. */
			scheduleStartAt: c.OptionalOutput<string>

			/** What the alert evaluates: `saved_search` (default, requires `saved_search_id`), `tile` (requires `dashboard_id` and `tile_id`), or `inline` (requires `chart_config`). Changing this forces replacement. */
			source: c.Output<string>

			/** Tags for the alert (up to 50, each at most 32 characters). Requires ClickStack API 2.38.0 or later. When unset, the server copies the saved search or dashboard tags, provider default tags included, each time the alert is written, and Terraform does not track them. Set `[]` for no tags of its own; provider default tags still apply. */
			tags: c.OptionalOutput<ReadonlyArray<string>>

			/** All tags on the resource: its own tags plus the provider's `clickstack_default_tags`. Null when `tags` is unset. */
			tagsAll: c.Output<ReadonlyArray<string>>

			/** Team ID to manage this alert under (`x-hdx-team`). Changing this forces the alert to be replaced. */
			team: c.OptionalOutput<string>

			/** Threshold value the alert compares against. For range types (`between`/`not_between`) this is the lower bound. */
			threshold: c.Output<number>

			/** Upper bound, required for `between`/`not_between` and ignored otherwise. Must be >= `threshold`. */
			thresholdMax: c.OptionalOutput<number>

			/** Comparison type: one of `above`, `below`, `above_exclusive`, `below_or_equal`, `equal`, `not_equal`, `between`, `not_between`. */
			thresholdType: c.Output<string>

			/** Server-assigned ID of the tile to alert on. Take it from the dashboard's `tile_ids` map by tile name; ids cannot be chosen in `dashboard_json`. Required together with `dashboard_id` when `source` is `tile`. The alert has no query of its own: the server reads the tile's chart config from the dashboard on every evaluation. The tile must be a line, stacked bar, or number tile. Changing this to a different known value forces replacement. */
			tileId: c.OptionalOutput<string>
		}>

		export class Alert {

			constructor(parent: c.Group, id: string, props: AlertInput, config?:c.ResourceConfig)

				readonly [c.nodeMetaSymbol]: c.ResourceMeta

				readonly urn: c.URN

			readonly channel: c.OptionalOutput<Readonly<{

				/** Email addresses to notify. Required when `type` is `email`. */
				emailRecipients: ReadonlyArray<string>

				/** PagerDuty severity: one of `critical`, `error`, `warning`, `info`. Required when the webhook service is `pagerduty_api`. */
				severity: string

				/** Slack channel ID to post to. Required when the webhook service is `slack_api`. */
				slackChannelId: string

				/** Channel type: `webhook` or `email`. */
				type: string

				/** ID of the webhook to notify. Required when `type` is `webhook`. */
				webhookId: string

				/** Service of the webhook in `webhook_id`, such as `slack_api` or `pagerduty_api`. The server always sets it from the webhook, so a configured value must match it. Setting it lets the plan check `slack_channel_id` and `severity` before apply. */
				webhookService: string
			}>>

			/** Notification channels for the alert, in order. Between 1 and 10 entries, no duplicates. Exactly one of `channel` or `channels` must be set. */
			readonly channels: c.OptionalOutput<ReadonlyArray<Readonly<{

				/** Email addresses to notify. Required when `type` is `email`. */
				emailRecipients?: ReadonlyArray<string>

				/** PagerDuty severity: one of `critical`, `error`, `warning`, `info`. Required when the webhook service is `pagerduty_api`. */
				severity?: string

				/** Slack channel ID to post to. Required when the webhook service is `slack_api`. */
				slackChannelId?: string

				/** Channel type: `webhook` or `email`. */
				type: string

				/** ID of the webhook to notify. Required when `type` is `webhook`. */
				webhookId?: string

				/** Service of the webhook in `webhook_id`, such as `slack_api` or `pagerduty_api`. The server always sets it from the webhook, so a configured value must match it. Setting it lets the plan check `slack_channel_id` and `severity` before apply. */
				webhookService: string
			}>>>

			/** Chart config for a standalone alert, as a JSON string in the same v2 API dialect as a tile's `config` in `dashboard_json`. Use `jsonencode(...)` or `file(...)`. Required when `source` is `inline` and rejected for the other sources. Only `line`, `stacked_bar` and `number` display types can be alerted on, as builder configs or raw SQL (`configType = "sql"`); PromQL charts cannot. A builder config also takes a chart-level `name`, `where` and `whereLanguage`, which a tile config does not. Like `dashboard_json`, this value is the sole source of truth: edits made to the alert's chart in the UI are not reported as drift. Self-hosted ClickStack only for now: the ClickHouse Cloud gateway's alert API does not list `inline` among its sources and has no chart config field, so it rejects the request. `saved_search` and `tile` alerts work on both. */
			readonly chartConfig: c.OptionalOutput<string>

			/** ID of the dashboard that owns the tile. Required together with `tile_id` when `source` is `tile`: a tile lives inside its dashboard document, so it can only be looked up through the dashboard. Changing this forces replacement, including when the dashboard itself is replaced: the server deletes a dashboard's tile alerts along with it, so the alert cannot outlive the dashboard it points at. */
			readonly dashboardId: c.OptionalOutput<string>

			/** Optional expression to evaluate the alert per group (saved-search alerts only). Sticky once set: the API keeps the previous value when the field is omitted and cannot clear it, so removing it from config is a no-op (recreate the alert to fully reset it). */
			readonly groupBy: c.Output<string>

			/** Identifier of the alert. */
			readonly id: c.Output<string>

			/** Evaluation window: one of `1m`, `5m`, `15m`, `30m`, `1h`, `6h`, `12h`, `1d`. */
			readonly interval: c.Output<string>

			/** Optional notification message template (1-4096 characters). */
			readonly message: c.OptionalOutput<string>

			/** Optional alert name (1-512 characters). */
			readonly name: c.OptionalOutput<string>

			/** Optional markdown note (1-4096 characters). */
			readonly note: c.OptionalOutput<string>

			/** Fire only after the condition holds for this many consecutive windows (>= 1). */
			readonly numConsecutiveWindows: c.OptionalOutput<number>

			/** ID of the saved search this alert evaluates. Required when `source` is `saved_search`. */
			readonly savedSearchId: c.OptionalOutput<string>

			/** Offset window boundaries by this many minutes (0-1439, and less than the interval). Mutually exclusive with `schedule_start_at`; setting one clears the other. */
			readonly scheduleOffsetMinutes: c.OptionalOutput<number>

			/** Absolute UTC anchor (RFC3339) for window alignment. Mutually exclusive with a non-zero `schedule_offset_minutes`; setting one clears the other. */
			readonly scheduleStartAt: c.OptionalOutput<string>

			/** What the alert evaluates: `saved_search` (default, requires `saved_search_id`), `tile` (requires `dashboard_id` and `tile_id`), or `inline` (requires `chart_config`). Changing this forces replacement. */
			readonly source: c.Output<string>

			/** Tags for the alert (up to 50, each at most 32 characters). Requires ClickStack API 2.38.0 or later. When unset, the server copies the saved search or dashboard tags, provider default tags included, each time the alert is written, and Terraform does not track them. Set `[]` for no tags of its own; provider default tags still apply. */
			readonly tags: c.OptionalOutput<ReadonlyArray<string>>

			/** All tags on the resource: its own tags plus the provider's `clickstack_default_tags`. Null when `tags` is unset. */
			readonly tagsAll: c.Output<ReadonlyArray<string>>

			/** Team ID to manage this alert under (`x-hdx-team`). Changing this forces the alert to be replaced. */
			readonly team: c.OptionalOutput<string>

			/** Threshold value the alert compares against. For range types (`between`/`not_between`) this is the lower bound. */
			readonly threshold: c.Output<number>

			/** Upper bound, required for `between`/`not_between` and ignored otherwise. Must be >= `threshold`. */
			readonly thresholdMax: c.OptionalOutput<number>

			/** Comparison type: one of `above`, `below`, `above_exclusive`, `below_or_equal`, `equal`, `not_equal`, `between`, `not_between`. */
			readonly thresholdType: c.Output<string>

			/** Server-assigned ID of the tile to alert on. Take it from the dashboard's `tile_ids` map by tile name; ids cannot be chosen in `dashboard_json`. Required together with `dashboard_id` when `source` is `tile`. The alert has no query of its own: the server reads the tile's chart config from the dashboard on every evaluation. The tile must be a line, stacked bar, or number tile. Changing this to a different known value forces replacement. */
			readonly tileId: c.OptionalOutput<string>

		}
		export type ConnectionInput = {

			/** ClickHouse HTTP endpoint URL, e.g. `https://clickhouse.example.com:8443`. */
			host: c.Input<string>

			/** Prefix for HyperDX-specific ClickHouse settings. Must only contain alphanumeric characters and underscores. */
			hyperdxSettingPrefix?: c.OptionalInput<string>

			/** Display name for the connection. */
			name: c.Input<string>

			/** ClickHouse password. The API never returns the password, so drift in this attribute cannot be detected. After import, the next apply re-sends the configured password. */
			password?: c.OptionalInput<string>

			/** Prometheus-compatible API endpoint, e.g. `http://prometheus:9090`. When set, PromQL queries are proxied to this endpoint. */
			prometheusEndpoint?: c.OptionalInput<string>

			/** Team ID to manage this connection under, sent as the `x-hdx-team` header. Defaults to the API key's team. Only honored by multi-team (EE) deployments, which validate the API key's membership in the team; single-team (OSS) deployments ignore it. Changing this forces the connection to be replaced, since a connection ID is scoped to a single team. */
			team?: c.OptionalInput<string>

			/** ClickHouse username. */
			username: c.Input<string>
		}

		export type ConnectionOutput = Readonly<{

			/** ClickHouse HTTP endpoint URL, e.g. `https://clickhouse.example.com:8443`. */
			host: c.Output<string>

			/** Prefix for HyperDX-specific ClickHouse settings. Must only contain alphanumeric characters and underscores. */
			hyperdxSettingPrefix: c.OptionalOutput<string>

			/** Identifier of the connection. */
			id: c.Output<string>

			/** Display name for the connection. */
			name: c.Output<string>

			/** ClickHouse password. The API never returns the password, so drift in this attribute cannot be detected. After import, the next apply re-sends the configured password. */
			password: c.OptionalOutput<string>

			/** Prometheus-compatible API endpoint, e.g. `http://prometheus:9090`. When set, PromQL queries are proxied to this endpoint. */
			prometheusEndpoint: c.OptionalOutput<string>

			/** Team ID to manage this connection under, sent as the `x-hdx-team` header. Defaults to the API key's team. Only honored by multi-team (EE) deployments, which validate the API key's membership in the team; single-team (OSS) deployments ignore it. Changing this forces the connection to be replaced, since a connection ID is scoped to a single team. */
			team: c.OptionalOutput<string>

			/** ClickHouse username. */
			username: c.Output<string>
		}>

		export class Connection {

			constructor(parent: c.Group, id: string, props: ConnectionInput, config?:c.ResourceConfig)

				readonly [c.nodeMetaSymbol]: c.ResourceMeta

				readonly urn: c.URN


			/** ClickHouse HTTP endpoint URL, e.g. `https://clickhouse.example.com:8443`. */
			readonly host: c.Output<string>

			/** Prefix for HyperDX-specific ClickHouse settings. Must only contain alphanumeric characters and underscores. */
			readonly hyperdxSettingPrefix: c.OptionalOutput<string>

			/** Identifier of the connection. */
			readonly id: c.Output<string>

			/** Display name for the connection. */
			readonly name: c.Output<string>

			/** ClickHouse password. The API never returns the password, so drift in this attribute cannot be detected. After import, the next apply re-sends the configured password. */
			readonly password: c.OptionalOutput<string>

			/** Prometheus-compatible API endpoint, e.g. `http://prometheus:9090`. When set, PromQL queries are proxied to this endpoint. */
			readonly prometheusEndpoint: c.OptionalOutput<string>

			/** Team ID to manage this connection under, sent as the `x-hdx-team` header. Defaults to the API key's team. Only honored by multi-team (EE) deployments, which validate the API key's membership in the team; single-team (OSS) deployments ignore it. Changing this forces the connection to be replaced, since a connection ID is scoped to a single team. */
			readonly team: c.OptionalOutput<string>

			/** ClickHouse username. */
			readonly username: c.Output<string>

		}
		export type DashboardInput = {

			/** The dashboard body as a JSON string, in the v2 API format. Use `jsonencode(...)` or `file(...)`. */
			dashboardJson: c.Input<string>

			/** Team ID to manage this dashboard under (`x-hdx-team`). Changing this forces replacement. */
			team?: c.OptionalInput<string>
		}

		export type DashboardOutput = Readonly<{

			/** The dashboard body as a JSON string, in the v2 API format. Use `jsonencode(...)` or `file(...)`. */
			dashboardJson: c.Output<string>

			/** Identifier of the dashboard. */
			id: c.Output<string>

			/** Server-canonical dashboard body returned by the API (defaults applied, server-assigned tile IDs). */
			normalizedJson: c.Output<string>

			/** All tags on the resource: its own tags plus the provider's `clickstack_default_tags`. */
			tagsAll: c.Output<ReadonlyArray<string>>

			/** Team ID to manage this dashboard under (`x-hdx-team`). Changing this forces replacement. */
			team: c.OptionalOutput<string>

			/** Server-assigned tile ids keyed by tile name, for tiles whose name is non-empty and unique within the dashboard. Reference these from `clickhouse_clickstack_alert` (`source = "tile"`): `tile_id = clickhouse_clickstack_dashboard.x.tile_ids["<tile name>"]`. Tile ids cannot be chosen in `dashboard_json`; the server assigns them and keeps them across updates for tiles that keep their unique name. Position only decides which id a blank- or duplicate-named tile gets, and only among those tiles: a named tile's id is never taken by position. A tile that keeps its unique name keeps its id at plan time; a new or renamed tile's id is known only after apply, and a name that disappears leaves the map, so an alert still referencing it fails at plan time with an invalid index. */
			tileIds: c.Output<Readonly<_Record<string>>>
		}>

		export class Dashboard {

			constructor(parent: c.Group, id: string, props: DashboardInput, config?:c.ResourceConfig)

				readonly [c.nodeMetaSymbol]: c.ResourceMeta

				readonly urn: c.URN


			/** The dashboard body as a JSON string, in the v2 API format. Use `jsonencode(...)` or `file(...)`. */
			readonly dashboardJson: c.Output<string>

			/** Identifier of the dashboard. */
			readonly id: c.Output<string>

			/** Server-canonical dashboard body returned by the API (defaults applied, server-assigned tile IDs). */
			readonly normalizedJson: c.Output<string>

			/** All tags on the resource: its own tags plus the provider's `clickstack_default_tags`. */
			readonly tagsAll: c.Output<ReadonlyArray<string>>

			/** Team ID to manage this dashboard under (`x-hdx-team`). Changing this forces replacement. */
			readonly team: c.OptionalOutput<string>

			/** Server-assigned tile ids keyed by tile name, for tiles whose name is non-empty and unique within the dashboard. Reference these from `clickhouse_clickstack_alert` (`source = "tile"`): `tile_id = clickhouse_clickstack_dashboard.x.tile_ids["<tile name>"]`. Tile ids cannot be chosen in `dashboard_json`; the server assigns them and keeps them across updates for tiles that keep their unique name. Position only decides which id a blank- or duplicate-named tile gets, and only among those tiles: a named tile's id is never taken by position. A tile that keeps its unique name keeps its id at plan time; a new or renamed tile's id is known only after apply, and a name that disappears leaves the map, so an alert still referencing it fails at plan time with an invalid index. */
			readonly tileIds: c.Output<Readonly<_Record<string>>>

		}
		export type RoleInput = {

			/** Human-readable description of the role. */
			description?: c.OptionalInput<string>

			/** Name of the role. Must not match a predefined role name. */
			name: c.Input<string>

			/** Set of CASL permission rules granted by the role. */
			permissions: c.Input<Array<c.Input<{

				/** Action: one of `create`, `read`, `update`, `delete`, `manage`. */
				action: c.Input<string>

				/** Optional JSON-encoded conditions object constraining the permission. */
				conditions?: c.OptionalInput<string>

				/** Optional list of fields the permission is restricted to. */
				fields?: c.OptionalInput<Array<c.Input<string>>>

				/** Integration the permission applies to: `mongodb` (API) or `clickhouse` (data RBAC). Defaults to `mongodb`. */
				integration?: c.OptionalInput<string>

				/** When true, the rule denies rather than allows the action. Defaults to false. */
				inverted?: c.OptionalInput<boolean>

				/** Subject (resource): e.g. `Alert`, `Connection`, `Dashboard`, `SavedSearch`, `Source`, `Team`, `User`, `Webhook`, `Role`, `Notebook`, or `all`. */
				subject: c.Input<string>
			}>>>

			/** Team ID to manage this role under, sent as the `x-hdx-team` header. Defaults to the API key's team. Changing this forces the role to be replaced. */
			team?: c.OptionalInput<string>
		}

		export type RoleOutput = Readonly<{

			/** Human-readable description of the role. */
			description: c.OptionalOutput<string>

			/** Identifier of the role. */
			id: c.Output<string>

			/** Name of the role. Must not match a predefined role name. */
			name: c.Output<string>

			/** Set of CASL permission rules granted by the role. */
			permissions: c.Output<ReadonlyArray<Readonly<{

				/** Action: one of `create`, `read`, `update`, `delete`, `manage`. */
				action: string

				/** Optional JSON-encoded conditions object constraining the permission. */
				conditions?: string

				/** Optional list of fields the permission is restricted to. */
				fields?: ReadonlyArray<string>

				/** Integration the permission applies to: `mongodb` (API) or `clickhouse` (data RBAC). Defaults to `mongodb`. */
				integration: string

				/** When true, the rule denies rather than allows the action. Defaults to false. */
				inverted: boolean

				/** Subject (resource): e.g. `Alert`, `Connection`, `Dashboard`, `SavedSearch`, `Source`, `Team`, `User`, `Webhook`, `Role`, `Notebook`, or `all`. */
				subject: string
			}>>>

			/** Team ID to manage this role under, sent as the `x-hdx-team` header. Defaults to the API key's team. Changing this forces the role to be replaced. */
			team: c.OptionalOutput<string>
		}>

		export class Role {

			constructor(parent: c.Group, id: string, props: RoleInput, config?:c.ResourceConfig)

				readonly [c.nodeMetaSymbol]: c.ResourceMeta

				readonly urn: c.URN


			/** Human-readable description of the role. */
			readonly description: c.OptionalOutput<string>

			/** Identifier of the role. */
			readonly id: c.Output<string>

			/** Name of the role. Must not match a predefined role name. */
			readonly name: c.Output<string>

			/** Set of CASL permission rules granted by the role. */
			readonly permissions: c.Output<ReadonlyArray<Readonly<{

				/** Action: one of `create`, `read`, `update`, `delete`, `manage`. */
				action: string

				/** Optional JSON-encoded conditions object constraining the permission. */
				conditions?: string

				/** Optional list of fields the permission is restricted to. */
				fields?: ReadonlyArray<string>

				/** Integration the permission applies to: `mongodb` (API) or `clickhouse` (data RBAC). Defaults to `mongodb`. */
				integration: string

				/** When true, the rule denies rather than allows the action. Defaults to false. */
				inverted: boolean

				/** Subject (resource): e.g. `Alert`, `Connection`, `Dashboard`, `SavedSearch`, `Source`, `Team`, `User`, `Webhook`, `Role`, `Notebook`, or `all`. */
				subject: string
			}>>>

			/** Team ID to manage this role under, sent as the `x-hdx-team` header. Defaults to the API key's team. Changing this forces the role to be replaced. */
			readonly team: c.OptionalOutput<string>

		}
		export type SavedSearchInput = {

			/** Pinned sidebar filters as a JSON array string. Defaults to `[]`; the authored value is kept as-is (removing the attribute resets it to `[]`). Each filter object should include its `type` (`sql`, `lucene`, or `sql_ast`) and only the keys the API recognizes. */
			filters?: c.OptionalInput<string>

			/** Display name for the saved search. */
			name: c.Input<string>

			/** Order-by expression. Defaults to empty. */
			orderBy?: c.OptionalInput<string>

			/** Comma-separated column expressions to select. Defaults to empty. */
			select?: c.OptionalInput<string>

			/** ID of the ClickStack source this saved search queries. */
			sourceId: c.Input<string>

			/** Tags applied to the saved search. */
			tags?: c.OptionalInput<Array<c.Input<string>>>

			/** Team ID to manage this saved search under (`x-hdx-team`). Changing this forces the saved search to be replaced. */
			team?: c.OptionalInput<string>

			/** Row filter expression. Defaults to empty. */
			where?: c.OptionalInput<string>

			/** Language of `where`: `lucene` (default) or `sql`. */
			whereLanguage?: c.OptionalInput<string>
		}

		export type SavedSearchOutput = Readonly<{

			/** Pinned sidebar filters as a JSON array string. Defaults to `[]`; the authored value is kept as-is (removing the attribute resets it to `[]`). Each filter object should include its `type` (`sql`, `lucene`, or `sql_ast`) and only the keys the API recognizes. */
			filters: c.Output<string>

			/** Identifier of the saved search. */
			id: c.Output<string>

			/** Display name for the saved search. */
			name: c.Output<string>

			/** Order-by expression. Defaults to empty. */
			orderBy: c.Output<string>

			/** Comma-separated column expressions to select. Defaults to empty. */
			select: c.Output<string>

			/** ID of the ClickStack source this saved search queries. */
			sourceId: c.Output<string>

			/** Tags applied to the saved search. */
			tags: c.Output<ReadonlyArray<string>>

			/** All tags on the resource: its own tags plus the provider's `clickstack_default_tags`. */
			tagsAll: c.Output<ReadonlyArray<string>>

			/** Team ID to manage this saved search under (`x-hdx-team`). Changing this forces the saved search to be replaced. */
			team: c.OptionalOutput<string>

			/** Row filter expression. Defaults to empty. */
			where: c.Output<string>

			/** Language of `where`: `lucene` (default) or `sql`. */
			whereLanguage: c.Output<string>
		}>

		export class SavedSearch {

			constructor(parent: c.Group, id: string, props: SavedSearchInput, config?:c.ResourceConfig)

				readonly [c.nodeMetaSymbol]: c.ResourceMeta

				readonly urn: c.URN


			/** Pinned sidebar filters as a JSON array string. Defaults to `[]`; the authored value is kept as-is (removing the attribute resets it to `[]`). Each filter object should include its `type` (`sql`, `lucene`, or `sql_ast`) and only the keys the API recognizes. */
			readonly filters: c.Output<string>

			/** Identifier of the saved search. */
			readonly id: c.Output<string>

			/** Display name for the saved search. */
			readonly name: c.Output<string>

			/** Order-by expression. Defaults to empty. */
			readonly orderBy: c.Output<string>

			/** Comma-separated column expressions to select. Defaults to empty. */
			readonly select: c.Output<string>

			/** ID of the ClickStack source this saved search queries. */
			readonly sourceId: c.Output<string>

			/** Tags applied to the saved search. */
			readonly tags: c.Output<ReadonlyArray<string>>

			/** All tags on the resource: its own tags plus the provider's `clickstack_default_tags`. */
			readonly tagsAll: c.Output<ReadonlyArray<string>>

			/** Team ID to manage this saved search under (`x-hdx-team`). Changing this forces the saved search to be replaced. */
			readonly team: c.OptionalOutput<string>

			/** Row filter expression. Defaults to empty. */
			readonly where: c.Output<string>

			/** Language of `where`: `lucene` (default) or `sql`. */
			readonly whereLanguage: c.Output<string>

		}
		export type SourceInput = {

			/** Expression to extract the log message body (log). */
			bodyExpression?: c.OptionalInput<string>

			/** ID of the ClickHouse connection used by this source. */
			connectionId: c.Input<string>

			/** Default columns selected in search results. Required for `log` and `trace`. */
			defaultTableSelectExpression?: c.OptionalInput<string>

			/** When true, the source is hidden from source selectors in the UI. Defaults to false. */
			disabled?: c.OptionalInput<boolean>

			/** DateTime column used to display and order search results. */
			displayedTimestampValueExpression?: c.OptionalInput<string>

			/** Expression to extract span duration. Required for `trace`. */
			durationExpression?: c.OptionalInput<string>

			/** Number of decimal digits in the duration value (3=ms, 6=us, 9=ns). Defaults to 3. Applies to `trace`. */
			durationPrecision?: c.OptionalInput<number>

			/** Expression to extract event-level attributes. */
			eventAttributesExpression?: c.OptionalInput<string>
			filterSettings?: c.OptionalInput<{

				/** Columns that must be filtered on every query against this source. */
				columns: c.Input<Array<c.Input<{

					/** Whether an "all values" selection is offered for this column instead of requiring explicit values. Defaults to false. */
					allowAll?: c.OptionalInput<boolean>

					/** Optional display label for the filter in the UI. */
					label?: c.OptionalInput<string>

					/** Column name to filter on. */
					name: c.Input<string>
				}>>>

				/** Database of the dictionary table backing the filter values. */
				databaseName: c.Input<string>

				/** Dictionary table backing the filter values. */
				tableName: c.Input<string>
			}>
			from: c.Input<{

				/** ClickHouse database name. */
				databaseName: c.Input<string>

				/** ClickHouse table name. Required for all kinds except `metric` (which locates tables via `metric_tables`). */
				tableName?: c.OptionalInput<string>
			}>

			/** Attributes displayed in the row side panel for the selected row. */
			highlightedRowAttributeExpressions?: c.OptionalInput<Array<c.Input<{

				/** Optional alias for the attribute. */
				alias?: c.OptionalInput<string>

				/** Optional Lucene version of the SQL expression. */
				luceneExpression?: c.OptionalInput<string>

				/** SQL expression for the attribute. */
				sqlExpression: c.Input<string>
			}>>>

			/** Attributes displayed in the trace view for the selected trace. */
			highlightedTraceAttributeExpressions?: c.OptionalInput<Array<c.Input<{

				/** Optional alias for the attribute. */
				alias?: c.OptionalInput<string>

				/** Optional Lucene version of the SQL expression. */
				luceneExpression?: c.OptionalInput<string>

				/** SQL expression for the attribute. */
				sqlExpression: c.Input<string>
			}>>>

			/** Column used for full-text search when no property is specified in a Lucene search. */
			implicitColumnExpression?: c.OptionalInput<string>

			/** Source kind: one of `log`, `trace`, `metric`, `session`, `promql`. */
			kind: c.Input<string>

			/** For distributed tables with non-matching column sets: columns supported across all target tables. */
			knownColumnsListExpression?: c.OptionalInput<string>

			/** Correlated log source ID. */
			logSourceId?: c.OptionalInput<string>

			/** Materialized views for query optimization (log, trace). */
			materializedViews?: c.OptionalInput<Array<c.Input<{

				/** Columns pre-aggregated by the materialized view. */
				aggregatedColumns: c.Input<Array<c.Input<{

					/** Aggregation function (e.g. count, sum, avg). */
					aggFn: c.Input<string>

					/** Materialized view column name. */
					mvColumn: c.Input<string>

					/** Source column name (required unless agg_fn is `count`). */
					sourceColumn?: c.OptionalInput<string>
				}>>>

				/** Materialized view database name. */
				databaseName: c.Input<string>

				/** Non-aggregated columns usable for filtering and grouping. */
				dimensionColumns: c.Input<string>

				/** Earliest date/time (RFC3339) for which the view contains data. */
				minDate?: c.OptionalInput<string>

				/** Timestamp granularity in short form (e.g. `5m`, `15s`, `1h`, `1d`). */
				minGranularity: c.Input<string>

				/** Materialized view table name. */
				tableName: c.Input<string>

				/** Timestamp column name. */
				timestampColumn: c.Input<string>
			}>>>
			metadataMaterializedViews?: c.OptionalInput<{

				/** Granularity of the rollup tables in short form (e.g. `15m`). */
				granularity: c.Input<string>

				/** Table name for the key rollup (field discovery). */
				keyRollupTable: c.Input<string>

				/** Table name for the key-value rollup (value autocomplete). */
				kvRollupTable: c.Input<string>
			}>

			/** Correlated metric source ID. */
			metricSourceId?: c.OptionalInput<string>
			metricTables?: c.OptionalInput<{

				/** Table containing exponential histogram metrics data. */
				exponentialHistogram?: c.OptionalInput<string>

				/** Table containing gauge metrics data. */
				gauge?: c.OptionalInput<string>

				/** Table containing histogram metrics data. */
				histogram?: c.OptionalInput<string>

				/** Table containing sum metrics data. */
				sum?: c.OptionalInput<string>

				/** Table containing summary metrics data. */
				summary?: c.OptionalInput<string>
			}>

			/** Display name for the source. */
			name: c.Input<string>

			/** Expression used to order rows. */
			orderByExpression?: c.OptionalInput<string>

			/** Expression to extract the parent span ID. Required for `trace`. */
			parentSpanIdExpression?: c.OptionalInput<string>

			/** Optional ClickHouse query settings applied when querying this source. */
			querySettings?: c.OptionalInput<Array<c.Input<{

				/** ClickHouse setting name. */
				setting: c.Input<string>

				/** Setting value. */
				value: c.Input<string>
			}>>>

			/** Expression to extract resource-level attributes. Required for `metric`. */
			resourceAttributesExpression?: c.OptionalInput<string>

			/** Expression to extract the trace sample rate. */
			sampleRateExpression?: c.OptionalInput<string>

			/** Optional grouping label used to organize sources in the source selector. */
			section?: c.OptionalInput<string>

			/** Expression to extract the service name. */
			serviceNameExpression?: c.OptionalInput<string>

			/** Correlated session source ID (trace). */
			sessionSourceId?: c.OptionalInput<string>

			/** Expression to extract the severity/log level text (log). */
			severityTextExpression?: c.OptionalInput<string>

			/** Expression to extract span events. */
			spanEventsValueExpression?: c.OptionalInput<string>

			/** Expression to extract the span ID. */
			spanIdExpression?: c.OptionalInput<string>

			/** Expression to extract the span kind. Required for `trace`. */
			spanKindExpression?: c.OptionalInput<string>

			/** Expression to extract the span name. Required for `trace`. */
			spanNameExpression?: c.OptionalInput<string>

			/** Expression to extract the span status code. */
			statusCodeExpression?: c.OptionalInput<string>

			/** Expression to extract the span status message. */
			statusMessageExpression?: c.OptionalInput<string>

			/** Team ID to manage this source under, sent as the `x-hdx-team` header. Defaults to the API key's team. Only honored by multi-team (EE) deployments. Changing this forces the source to be replaced. */
			team?: c.OptionalInput<string>

			/** DateTime column or expression that is part of the table's primary key. */
			timestampValueExpression: c.Input<string>

			/** Expression to extract the trace ID. */
			traceIdExpression?: c.OptionalInput<string>

			/** Correlated trace source ID. Required for `session`. */
			traceSourceId?: c.OptionalInput<string>

			/** Whether to use ClickHouse text indices for the implicit column: `auto`, `enabled`, or `disabled`. */
			useTextIndexForImplicitColumn?: c.OptionalInput<string>
		}

		export type SourceOutput = Readonly<{

			/** Expression to extract the log message body (log). */
			bodyExpression: c.OptionalOutput<string>

			/** ID of the ClickHouse connection used by this source. */
			connectionId: c.Output<string>

			/** Default columns selected in search results. Required for `log` and `trace`. */
			defaultTableSelectExpression: c.OptionalOutput<string>

			/** When true, the source is hidden from source selectors in the UI. Defaults to false. */
			disabled: c.Output<boolean>

			/** DateTime column used to display and order search results. */
			displayedTimestampValueExpression: c.OptionalOutput<string>

			/** Expression to extract span duration. Required for `trace`. */
			durationExpression: c.OptionalOutput<string>

			/** Number of decimal digits in the duration value (3=ms, 6=us, 9=ns). Defaults to 3. Applies to `trace`. */
			durationPrecision: c.Output<number>

			/** Expression to extract event-level attributes. */
			eventAttributesExpression: c.OptionalOutput<string>
			filterSettings: c.OptionalOutput<Readonly<{

				/** Columns that must be filtered on every query against this source. */
				columns: ReadonlyArray<Readonly<{

					/** Whether an "all values" selection is offered for this column instead of requiring explicit values. Defaults to false. */
					allowAll: boolean

					/** Optional display label for the filter in the UI. */
					label?: string

					/** Column name to filter on. */
					name: string
				}>>

				/** Database of the dictionary table backing the filter values. */
				databaseName: string

				/** Dictionary table backing the filter values. */
				tableName: string
			}>>
			from: c.Output<Readonly<{

				/** ClickHouse database name. */
				databaseName: string

				/** ClickHouse table name. Required for all kinds except `metric` (which locates tables via `metric_tables`). */
				tableName: string
			}>>

			/** Attributes displayed in the row side panel for the selected row. */
			highlightedRowAttributeExpressions: c.OptionalOutput<ReadonlyArray<Readonly<{

				/** Optional alias for the attribute. */
				alias?: string

				/** Optional Lucene version of the SQL expression. */
				luceneExpression?: string

				/** SQL expression for the attribute. */
				sqlExpression: string
			}>>>

			/** Attributes displayed in the trace view for the selected trace. */
			highlightedTraceAttributeExpressions: c.OptionalOutput<ReadonlyArray<Readonly<{

				/** Optional alias for the attribute. */
				alias?: string

				/** Optional Lucene version of the SQL expression. */
				luceneExpression?: string

				/** SQL expression for the attribute. */
				sqlExpression: string
			}>>>

			/** Identifier of the source. */
			id: c.Output<string>

			/** Column used for full-text search when no property is specified in a Lucene search. */
			implicitColumnExpression: c.OptionalOutput<string>

			/** Source kind: one of `log`, `trace`, `metric`, `session`, `promql`. */
			kind: c.Output<string>

			/** For distributed tables with non-matching column sets: columns supported across all target tables. */
			knownColumnsListExpression: c.OptionalOutput<string>

			/** Correlated log source ID. */
			logSourceId: c.OptionalOutput<string>

			/** Materialized views for query optimization (log, trace). */
			materializedViews: c.OptionalOutput<ReadonlyArray<Readonly<{

				/** Columns pre-aggregated by the materialized view. */
				aggregatedColumns: ReadonlyArray<Readonly<{

					/** Aggregation function (e.g. count, sum, avg). */
					aggFn: string

					/** Materialized view column name. */
					mvColumn: string

					/** Source column name (required unless agg_fn is `count`). */
					sourceColumn?: string
				}>>

				/** Materialized view database name. */
				databaseName: string

				/** Non-aggregated columns usable for filtering and grouping. */
				dimensionColumns: string

				/** Earliest date/time (RFC3339) for which the view contains data. */
				minDate?: string

				/** Timestamp granularity in short form (e.g. `5m`, `15s`, `1h`, `1d`). */
				minGranularity: string

				/** Materialized view table name. */
				tableName: string

				/** Timestamp column name. */
				timestampColumn: string
			}>>>
			metadataMaterializedViews: c.OptionalOutput<Readonly<{

				/** Granularity of the rollup tables in short form (e.g. `15m`). */
				granularity: string

				/** Table name for the key rollup (field discovery). */
				keyRollupTable: string

				/** Table name for the key-value rollup (value autocomplete). */
				kvRollupTable: string
			}>>

			/** Correlated metric source ID. */
			metricSourceId: c.OptionalOutput<string>
			metricTables: c.OptionalOutput<Readonly<{

				/** Table containing exponential histogram metrics data. */
				exponentialHistogram: string

				/** Table containing gauge metrics data. */
				gauge: string

				/** Table containing histogram metrics data. */
				histogram: string

				/** Table containing sum metrics data. */
				sum: string

				/** Table containing summary metrics data. */
				summary: string
			}>>

			/** Display name for the source. */
			name: c.Output<string>

			/** Expression used to order rows. */
			orderByExpression: c.OptionalOutput<string>

			/** Expression to extract the parent span ID. Required for `trace`. */
			parentSpanIdExpression: c.OptionalOutput<string>

			/** Optional ClickHouse query settings applied when querying this source. */
			querySettings: c.OptionalOutput<ReadonlyArray<Readonly<{

				/** ClickHouse setting name. */
				setting: string

				/** Setting value. */
				value: string
			}>>>

			/** Expression to extract resource-level attributes. Required for `metric`. */
			resourceAttributesExpression: c.OptionalOutput<string>

			/** Expression to extract the trace sample rate. */
			sampleRateExpression: c.OptionalOutput<string>

			/** Optional grouping label used to organize sources in the source selector. */
			section: c.OptionalOutput<string>

			/** Expression to extract the service name. */
			serviceNameExpression: c.OptionalOutput<string>

			/** Correlated session source ID (trace). */
			sessionSourceId: c.OptionalOutput<string>

			/** Expression to extract the severity/log level text (log). */
			severityTextExpression: c.OptionalOutput<string>

			/** Expression to extract span events. */
			spanEventsValueExpression: c.OptionalOutput<string>

			/** Expression to extract the span ID. */
			spanIdExpression: c.OptionalOutput<string>

			/** Expression to extract the span kind. Required for `trace`. */
			spanKindExpression: c.OptionalOutput<string>

			/** Expression to extract the span name. Required for `trace`. */
			spanNameExpression: c.OptionalOutput<string>

			/** Expression to extract the span status code. */
			statusCodeExpression: c.OptionalOutput<string>

			/** Expression to extract the span status message. */
			statusMessageExpression: c.OptionalOutput<string>

			/** Team ID to manage this source under, sent as the `x-hdx-team` header. Defaults to the API key's team. Only honored by multi-team (EE) deployments. Changing this forces the source to be replaced. */
			team: c.OptionalOutput<string>

			/** DateTime column or expression that is part of the table's primary key. */
			timestampValueExpression: c.Output<string>

			/** Expression to extract the trace ID. */
			traceIdExpression: c.OptionalOutput<string>

			/** Correlated trace source ID. Required for `session`. */
			traceSourceId: c.OptionalOutput<string>

			/** Whether to use ClickHouse text indices for the implicit column: `auto`, `enabled`, or `disabled`. */
			useTextIndexForImplicitColumn: c.OptionalOutput<string>
		}>

		export class Source {

			constructor(parent: c.Group, id: string, props: SourceInput, config?:c.ResourceConfig)

				readonly [c.nodeMetaSymbol]: c.ResourceMeta

				readonly urn: c.URN


			/** Expression to extract the log message body (log). */
			readonly bodyExpression: c.OptionalOutput<string>

			/** ID of the ClickHouse connection used by this source. */
			readonly connectionId: c.Output<string>

			/** Default columns selected in search results. Required for `log` and `trace`. */
			readonly defaultTableSelectExpression: c.OptionalOutput<string>

			/** When true, the source is hidden from source selectors in the UI. Defaults to false. */
			readonly disabled: c.Output<boolean>

			/** DateTime column used to display and order search results. */
			readonly displayedTimestampValueExpression: c.OptionalOutput<string>

			/** Expression to extract span duration. Required for `trace`. */
			readonly durationExpression: c.OptionalOutput<string>

			/** Number of decimal digits in the duration value (3=ms, 6=us, 9=ns). Defaults to 3. Applies to `trace`. */
			readonly durationPrecision: c.Output<number>

			/** Expression to extract event-level attributes. */
			readonly eventAttributesExpression: c.OptionalOutput<string>
			readonly filterSettings: c.OptionalOutput<Readonly<{

				/** Columns that must be filtered on every query against this source. */
				columns: ReadonlyArray<Readonly<{

					/** Whether an "all values" selection is offered for this column instead of requiring explicit values. Defaults to false. */
					allowAll: boolean

					/** Optional display label for the filter in the UI. */
					label?: string

					/** Column name to filter on. */
					name: string
				}>>

				/** Database of the dictionary table backing the filter values. */
				databaseName: string

				/** Dictionary table backing the filter values. */
				tableName: string
			}>>
			readonly from: c.Output<Readonly<{

				/** ClickHouse database name. */
				databaseName: string

				/** ClickHouse table name. Required for all kinds except `metric` (which locates tables via `metric_tables`). */
				tableName: string
			}>>

			/** Attributes displayed in the row side panel for the selected row. */
			readonly highlightedRowAttributeExpressions: c.OptionalOutput<ReadonlyArray<Readonly<{

				/** Optional alias for the attribute. */
				alias?: string

				/** Optional Lucene version of the SQL expression. */
				luceneExpression?: string

				/** SQL expression for the attribute. */
				sqlExpression: string
			}>>>

			/** Attributes displayed in the trace view for the selected trace. */
			readonly highlightedTraceAttributeExpressions: c.OptionalOutput<ReadonlyArray<Readonly<{

				/** Optional alias for the attribute. */
				alias?: string

				/** Optional Lucene version of the SQL expression. */
				luceneExpression?: string

				/** SQL expression for the attribute. */
				sqlExpression: string
			}>>>

			/** Identifier of the source. */
			readonly id: c.Output<string>

			/** Column used for full-text search when no property is specified in a Lucene search. */
			readonly implicitColumnExpression: c.OptionalOutput<string>

			/** Source kind: one of `log`, `trace`, `metric`, `session`, `promql`. */
			readonly kind: c.Output<string>

			/** For distributed tables with non-matching column sets: columns supported across all target tables. */
			readonly knownColumnsListExpression: c.OptionalOutput<string>

			/** Correlated log source ID. */
			readonly logSourceId: c.OptionalOutput<string>

			/** Materialized views for query optimization (log, trace). */
			readonly materializedViews: c.OptionalOutput<ReadonlyArray<Readonly<{

				/** Columns pre-aggregated by the materialized view. */
				aggregatedColumns: ReadonlyArray<Readonly<{

					/** Aggregation function (e.g. count, sum, avg). */
					aggFn: string

					/** Materialized view column name. */
					mvColumn: string

					/** Source column name (required unless agg_fn is `count`). */
					sourceColumn?: string
				}>>

				/** Materialized view database name. */
				databaseName: string

				/** Non-aggregated columns usable for filtering and grouping. */
				dimensionColumns: string

				/** Earliest date/time (RFC3339) for which the view contains data. */
				minDate?: string

				/** Timestamp granularity in short form (e.g. `5m`, `15s`, `1h`, `1d`). */
				minGranularity: string

				/** Materialized view table name. */
				tableName: string

				/** Timestamp column name. */
				timestampColumn: string
			}>>>
			readonly metadataMaterializedViews: c.OptionalOutput<Readonly<{

				/** Granularity of the rollup tables in short form (e.g. `15m`). */
				granularity: string

				/** Table name for the key rollup (field discovery). */
				keyRollupTable: string

				/** Table name for the key-value rollup (value autocomplete). */
				kvRollupTable: string
			}>>

			/** Correlated metric source ID. */
			readonly metricSourceId: c.OptionalOutput<string>
			readonly metricTables: c.OptionalOutput<Readonly<{

				/** Table containing exponential histogram metrics data. */
				exponentialHistogram: string

				/** Table containing gauge metrics data. */
				gauge: string

				/** Table containing histogram metrics data. */
				histogram: string

				/** Table containing sum metrics data. */
				sum: string

				/** Table containing summary metrics data. */
				summary: string
			}>>

			/** Display name for the source. */
			readonly name: c.Output<string>

			/** Expression used to order rows. */
			readonly orderByExpression: c.OptionalOutput<string>

			/** Expression to extract the parent span ID. Required for `trace`. */
			readonly parentSpanIdExpression: c.OptionalOutput<string>

			/** Optional ClickHouse query settings applied when querying this source. */
			readonly querySettings: c.OptionalOutput<ReadonlyArray<Readonly<{

				/** ClickHouse setting name. */
				setting: string

				/** Setting value. */
				value: string
			}>>>

			/** Expression to extract resource-level attributes. Required for `metric`. */
			readonly resourceAttributesExpression: c.OptionalOutput<string>

			/** Expression to extract the trace sample rate. */
			readonly sampleRateExpression: c.OptionalOutput<string>

			/** Optional grouping label used to organize sources in the source selector. */
			readonly section: c.OptionalOutput<string>

			/** Expression to extract the service name. */
			readonly serviceNameExpression: c.OptionalOutput<string>

			/** Correlated session source ID (trace). */
			readonly sessionSourceId: c.OptionalOutput<string>

			/** Expression to extract the severity/log level text (log). */
			readonly severityTextExpression: c.OptionalOutput<string>

			/** Expression to extract span events. */
			readonly spanEventsValueExpression: c.OptionalOutput<string>

			/** Expression to extract the span ID. */
			readonly spanIdExpression: c.OptionalOutput<string>

			/** Expression to extract the span kind. Required for `trace`. */
			readonly spanKindExpression: c.OptionalOutput<string>

			/** Expression to extract the span name. Required for `trace`. */
			readonly spanNameExpression: c.OptionalOutput<string>

			/** Expression to extract the span status code. */
			readonly statusCodeExpression: c.OptionalOutput<string>

			/** Expression to extract the span status message. */
			readonly statusMessageExpression: c.OptionalOutput<string>

			/** Team ID to manage this source under, sent as the `x-hdx-team` header. Defaults to the API key's team. Only honored by multi-team (EE) deployments. Changing this forces the source to be replaced. */
			readonly team: c.OptionalOutput<string>

			/** DateTime column or expression that is part of the table's primary key. */
			readonly timestampValueExpression: c.Output<string>

			/** Expression to extract the trace ID. */
			readonly traceIdExpression: c.OptionalOutput<string>

			/** Correlated trace source ID. Required for `session`. */
			readonly traceSourceId: c.OptionalOutput<string>

			/** Whether to use ClickHouse text indices for the implicit column: `auto`, `enabled`, or `disabled`. */
			readonly useTextIndexForImplicitColumn: c.OptionalOutput<string>

		}
		export type TeamInput = {

			/** ID of the role assigned to new users who join the team. */
			defaultUserRoleId: c.Input<string>

			/** Team ID to manage, sent as the `x-hdx-team` header. Defaults to the API key's team. Changing this forces the resource to be replaced. */
			team?: c.OptionalInput<string>
		}

		export type TeamOutput = Readonly<{

			/** ID of the role assigned to new users who join the team. */
			defaultUserRoleId: c.Output<string>

			/** Identifier of the team. */
			id: c.Output<string>

			/** Team ID to manage, sent as the `x-hdx-team` header. Defaults to the API key's team. Changing this forces the resource to be replaced. */
			team: c.OptionalOutput<string>
		}>

		export class Team {

			constructor(parent: c.Group, id: string, props: TeamInput, config?:c.ResourceConfig)

				readonly [c.nodeMetaSymbol]: c.ResourceMeta

				readonly urn: c.URN


			/** ID of the role assigned to new users who join the team. */
			readonly defaultUserRoleId: c.Output<string>

			/** Identifier of the team. */
			readonly id: c.Output<string>

			/** Team ID to manage, sent as the `x-hdx-team` header. Defaults to the API key's team. Changing this forces the resource to be replaced. */
			readonly team: c.OptionalOutput<string>

		}
		export type TeamMemberInput = {

			/** Email address of the member. Changing this forces the member to be replaced. */
			email: c.Input<string>

			/** Display name used when creating a pending invitation. Changing this forces the member to be replaced. */
			name?: c.OptionalInput<string>

			/** ID of the role to assign to the member. Use the `clickstack_role` resource or data source to obtain it. Omit on OSS deployments, which have no RBAC and ignore the role. When omitted, the role assigned by the server (e.g. the team's default role on RBAC deployments) is tracked in state. */
			roleId?: c.OptionalInput<string>

			/** Team ID to manage this member under, sent as the `x-hdx-team` header. Defaults to the API key's team. Changing this forces the member to be replaced. */
			team?: c.OptionalInput<string>
		}

		export type TeamMemberOutput = Readonly<{

			/** Email address of the member. Changing this forces the member to be replaced. */
			email: c.Output<string>

			/** Identifier of the member. For an active member this is their user ID; for a pending invitation this is the invitation ID. */
			id: c.Output<string>

			/** Join URL for a pending invitation. Empty for active members. */
			inviteUrl: c.Output<string>

			/** Display name used when creating a pending invitation. Changing this forces the member to be replaced. */
			name: c.OptionalOutput<string>

			/** ID of the role to assign to the member. Use the `clickstack_role` resource or data source to obtain it. Omit on OSS deployments, which have no RBAC and ignore the role. When omitted, the role assigned by the server (e.g. the team's default role on RBAC deployments) is tracked in state. */
			roleId: c.Output<string>

			/** Membership status: `active` (account assigned the role) or `pending` (invitation outstanding). */
			status: c.Output<string>

			/** Team ID to manage this member under, sent as the `x-hdx-team` header. Defaults to the API key's team. Changing this forces the member to be replaced. */
			team: c.OptionalOutput<string>
		}>

		export class TeamMember {

			constructor(parent: c.Group, id: string, props: TeamMemberInput, config?:c.ResourceConfig)

				readonly [c.nodeMetaSymbol]: c.ResourceMeta

				readonly urn: c.URN


			/** Email address of the member. Changing this forces the member to be replaced. */
			readonly email: c.Output<string>

			/** Identifier of the member. For an active member this is their user ID; for a pending invitation this is the invitation ID. */
			readonly id: c.Output<string>

			/** Join URL for a pending invitation. Empty for active members. */
			readonly inviteUrl: c.Output<string>

			/** Display name used when creating a pending invitation. Changing this forces the member to be replaced. */
			readonly name: c.OptionalOutput<string>

			/** ID of the role to assign to the member. Use the `clickstack_role` resource or data source to obtain it. Omit on OSS deployments, which have no RBAC and ignore the role. When omitted, the role assigned by the server (e.g. the team's default role on RBAC deployments) is tracked in state. */
			readonly roleId: c.Output<string>

			/** Membership status: `active` (account assigned the role) or `pending` (invitation outstanding). */
			readonly status: c.Output<string>

			/** Team ID to manage this member under, sent as the `x-hdx-team` header. Defaults to the API key's team. Changing this forces the member to be replaced. */
			readonly team: c.OptionalOutput<string>

		}
		export type WebhookInput = {

			/** Request body template for `generic` and `incidentio` services. Not allowed for the `slack` service. */
			body?: c.OptionalInput<string>

			/** Optional description of the webhook. */
			description?: c.OptionalInput<string>

			/** Write-only HTTP headers sent with the webhook request (e.g. an `Authorization` token). Never stored in state or returned by the API. Not allowed for the `slack` service. Bump `headers_version` to re-send after a change. The server keeps the last-sent headers when this field is omitted, EXCEPT when `url` or `service` changes — that clears any omitted secret, so re-supply headers (and bump `headers_version`) whenever you change the destination. */
			headers?: c.OptionalInput<_Record<c.Input<string>>>

			/** Arbitrary value that, when changed, forces the write-only `headers` to be re-sent to the API. Because `headers` is write-only, Terraform cannot see a change to its value: editing the `headers` block alone produces no plan diff and no update, so bump this version (any new value) to roll a rotated secret. Note: this re-sends the CURRENT `headers` value; it does NOT clear the secret. Omitting `headers` leaves the last-sent value in place server-side — clearing a secret is not supported through this resource; recreate the webhook to remove it. */
			headersVersion?: c.OptionalInput<string>

			/** Display name for the webhook. Must be unique per service within a team. */
			name: c.Input<string>

			/** Write-only URL query parameters sent with the webhook request. Never stored in state or returned by the API. Not allowed for the `slack` service. Bump `query_params_version` to re-send after a change. */
			queryParams?: c.OptionalInput<_Record<c.Input<string>>>

			/** Arbitrary value that, when changed, forces the write-only `query_params` to be re-sent to the API. As with `headers_version`, it re-sends the current value and cannot clear the secret; recreate the webhook to remove it. */
			queryParamsVersion?: c.OptionalInput<string>

			/** Webhook service: one of `slack`, `generic`, `incidentio`, `slack_api`, or `pagerduty_api`. `slack_api` and `pagerduty_api` webhooks hold credentials the API cannot set, so create them in the ClickStack UI and import them. */
			service: c.Input<string>

			/** Team ID to manage this webhook under, sent as the `x-hdx-team` header. Defaults to the API key's team. Changing this forces the webhook to be replaced. */
			team?: c.OptionalInput<string>

			/** Destination URL the ClickStack server calls. Marked sensitive because Slack incoming-webhook URLs embed a channel token. Private-IP/SSRF validation is enforced server-side. */
			url: c.Input<string>
		}

		export type WebhookOutput = Readonly<{

			/** Request body template for `generic` and `incidentio` services. Not allowed for the `slack` service. */
			body: c.OptionalOutput<string>

			/** Optional description of the webhook. */
			description: c.OptionalOutput<string>

			/** Write-only HTTP headers sent with the webhook request (e.g. an `Authorization` token). Never stored in state or returned by the API. Not allowed for the `slack` service. Bump `headers_version` to re-send after a change. The server keeps the last-sent headers when this field is omitted, EXCEPT when `url` or `service` changes — that clears any omitted secret, so re-supply headers (and bump `headers_version`) whenever you change the destination. */
			headers: c.OptionalOutput<Readonly<_Record<string>>>

			/** Arbitrary value that, when changed, forces the write-only `headers` to be re-sent to the API. Because `headers` is write-only, Terraform cannot see a change to its value: editing the `headers` block alone produces no plan diff and no update, so bump this version (any new value) to roll a rotated secret. Note: this re-sends the CURRENT `headers` value; it does NOT clear the secret. Omitting `headers` leaves the last-sent value in place server-side — clearing a secret is not supported through this resource; recreate the webhook to remove it. */
			headersVersion: c.OptionalOutput<string>

			/** Identifier of the webhook. */
			id: c.Output<string>

			/** Display name for the webhook. Must be unique per service within a team. */
			name: c.Output<string>

			/** Write-only URL query parameters sent with the webhook request. Never stored in state or returned by the API. Not allowed for the `slack` service. Bump `query_params_version` to re-send after a change. */
			queryParams: c.OptionalOutput<Readonly<_Record<string>>>

			/** Arbitrary value that, when changed, forces the write-only `query_params` to be re-sent to the API. As with `headers_version`, it re-sends the current value and cannot clear the secret; recreate the webhook to remove it. */
			queryParamsVersion: c.OptionalOutput<string>

			/** Webhook service: one of `slack`, `generic`, `incidentio`, `slack_api`, or `pagerduty_api`. `slack_api` and `pagerduty_api` webhooks hold credentials the API cannot set, so create them in the ClickStack UI and import them. */
			service: c.Output<string>

			/** Team ID to manage this webhook under, sent as the `x-hdx-team` header. Defaults to the API key's team. Changing this forces the webhook to be replaced. */
			team: c.OptionalOutput<string>

			/** Destination URL the ClickStack server calls. Marked sensitive because Slack incoming-webhook URLs embed a channel token. Private-IP/SSRF validation is enforced server-side. */
			url: c.Output<string>
		}>

		export class Webhook {

			constructor(parent: c.Group, id: string, props: WebhookInput, config?:c.ResourceConfig)

				readonly [c.nodeMetaSymbol]: c.ResourceMeta

				readonly urn: c.URN


			/** Request body template for `generic` and `incidentio` services. Not allowed for the `slack` service. */
			readonly body: c.OptionalOutput<string>

			/** Optional description of the webhook. */
			readonly description: c.OptionalOutput<string>

			/** Write-only HTTP headers sent with the webhook request (e.g. an `Authorization` token). Never stored in state or returned by the API. Not allowed for the `slack` service. Bump `headers_version` to re-send after a change. The server keeps the last-sent headers when this field is omitted, EXCEPT when `url` or `service` changes — that clears any omitted secret, so re-supply headers (and bump `headers_version`) whenever you change the destination. */
			readonly headers: c.OptionalOutput<Readonly<_Record<string>>>

			/** Arbitrary value that, when changed, forces the write-only `headers` to be re-sent to the API. Because `headers` is write-only, Terraform cannot see a change to its value: editing the `headers` block alone produces no plan diff and no update, so bump this version (any new value) to roll a rotated secret. Note: this re-sends the CURRENT `headers` value; it does NOT clear the secret. Omitting `headers` leaves the last-sent value in place server-side — clearing a secret is not supported through this resource; recreate the webhook to remove it. */
			readonly headersVersion: c.OptionalOutput<string>

			/** Identifier of the webhook. */
			readonly id: c.Output<string>

			/** Display name for the webhook. Must be unique per service within a team. */
			readonly name: c.Output<string>

			/** Write-only URL query parameters sent with the webhook request. Never stored in state or returned by the API. Not allowed for the `slack` service. Bump `query_params_version` to re-send after a change. */
			readonly queryParams: c.OptionalOutput<Readonly<_Record<string>>>

			/** Arbitrary value that, when changed, forces the write-only `query_params` to be re-sent to the API. As with `headers_version`, it re-sends the current value and cannot clear the secret; recreate the webhook to remove it. */
			readonly queryParamsVersion: c.OptionalOutput<string>

			/** Webhook service: one of `slack`, `generic`, `incidentio`, `slack_api`, or `pagerduty_api`. `slack_api` and `pagerduty_api` webhooks hold credentials the API cannot set, so create them in the ClickStack UI and import them. */
			readonly service: c.Output<string>

			/** Team ID to manage this webhook under, sent as the `x-hdx-team` header. Defaults to the API key's team. Changing this forces the webhook to be replaced. */
			readonly team: c.OptionalOutput<string>

			/** Destination URL the ClickStack server calls. Marked sensitive because Slack incoming-webhook URLs embed a channel token. Private-IP/SSRF validation is enforced server-side. */
			readonly url: c.Output<string>

		}
	}
	export namespace organization {
		export type SettingsInput = {

			/** Whether core dumps collection is enabled for services in the organization. Defaults to the organization's current setting if not specified. */
			coreDumpsEnabled?: c.OptionalInput<boolean>
		}

		export type SettingsOutput = Readonly<{

			/** Whether core dumps collection is enabled for services in the organization. Defaults to the organization's current setting if not specified. */
			coreDumpsEnabled: c.Output<boolean>

			/** ID of the organization. This is set automatically from the provider configuration. */
			id: c.Output<string>
		}>

		export class Settings {

			constructor(parent: c.Group, id: string, props: SettingsInput, config?:c.ResourceConfig)

				readonly [c.nodeMetaSymbol]: c.ResourceMeta

				readonly urn: c.URN


			/** Whether core dumps collection is enabled for services in the organization. Defaults to the organization's current setting if not specified. */
			readonly coreDumpsEnabled: c.Output<boolean>

			/** ID of the organization. This is set automatically from the provider configuration. */
			readonly id: c.Output<string>

		}
	}
	export namespace postgres {
		export type ServiceInput = {

			/** Cloud provider hosting the instance. Supported values are 'aws' and 'gcp'. Postgres on GCP is in private preview; contact ClickHouse support to enable access for your organization and region. Required for a standard create; omit for a read replica or point-in-time restore (inherited from the source). */
			cloudProvider?: c.OptionalInput<string>

			/** High-availability mode. One of 'none' (single replica), 'async' (asynchronous replica), or 'sync' (synchronous replica). Mutable post-create; an HA flip triggers a transition. Omitting the attribute preserves the prior value (the server defaults to 'none' on Create); to actively downgrade, set 'ha_type = "none"' explicitly. Omit for a read replica or point-in-time restore (inherited from the source). */
			haType?: c.OptionalInput<string>

			/** IPv4 TCP access list. Omit to preserve existing rules or use the public defaults on creation. An empty list blocks public access on standard creation; on update it removes IPv4 rules only. IPv6 rules are not managed. */
			ipAccess?: c.OptionalInput<Array<c.Input<{

				/** Description of the IP address. */
				description: c.Input<string>

				/** TCP port or inclusive range from 1 to 65535. Use 5432 for Postgres and 6432 for PgBouncer, or a range such as 5432..6432. */
				portRange: c.Input<string>

				/** IPv4 address or CIDR allowed to connect. Use 0.0.0.0/0 to allow all IPv4 addresses. */
				source: c.Input<string>
			}>>>

			/** Human-readable name. Immutable post-create; changes force destroy-and-recreate. Differs from clickhouse_service, which allows in-place rename. */
			name: c.Input<string>

			/** Superuser password. Config-owned: the API does not return the password, so Terraform manages exactly the value declared here and never reads it back. One of `password` or `password_wo` is required for a standard service; forbidden for a read replica (it inherits the primary's superuser); optional for a point-in-time restore (omit to keep the source's password, which Terraform then does not track). Changing this value rotates the password (PATCH /password). Must be ≥12 chars with at least one lowercase, one uppercase, and one digit. Stored in (sensitive) state — prefer `password_wo` to keep it out of state. `terraform import` cannot recover the live password — the configured value is rotated in on the first apply after import. */
			password?: c.OptionalInput<string>

			/** Superuser password, write-only: applied to the service but never persisted to Terraform state (requires Terraform >= 1.11). Preferred over `password`. Requires `password_wo_version`; increment the version to rotate to the current `password_wo` value. Same complexity rules as `password`. Forbidden for a read replica. */
			passwordWo?: c.OptionalInput<string>

			/** Version number for `password_wo`. Increment to trigger a password rotation using the current `password_wo` value. */
			passwordWoVersion?: c.OptionalInput<number>

			/** Postgres server parameters (pgConfig) as a key-value map. Declared parameters are the desired state — every apply sends the full map via POST /config (full replacement), so removing a key from the map removes it server-side. Set `pg_config = {}` to clear all parameters; omit the attribute to preserve the prior state (read replicas inherit the primary's parameters, and the server may surface values the configuration never declared — so it is Optional+Computed like tags). Out-of-band changes are reverted on the next apply. Some parameters require a database restart; the provider surfaces the server's restart-required hint as a warning (restart out-of-band). */
			pgConfig?: c.OptionalInput<_Record<c.Input<string>>>

			/** PgBouncer connection-pooler parameters (pgBouncerConfig) as a key-value map. Same Optional+Computed semantics as pg_config; set `pgbouncer_config = {}` to clear. */
			pgbouncerConfig?: c.OptionalInput<_Record<c.Input<string>>>

			/** Major Postgres version (e.g. '18'). The server picks the patch release within that major. Changing the major triggers destroy-and-recreate. Omit for a read replica or point-in-time restore (inherited from the source). */
			postgresVersion?: c.OptionalInput<string>

			/** ID of the primary instance to replicate. When set, this instance is created as a read replica (streaming replication) of that primary. Immutable for a live replica: changing or removing it destroys and recreates the instance as a standalone primary. The one exception is an out-of-band promotion — if you promote the replica via the API/UI (is_primary becomes true), changing or removing read_replica_of then reconciles state in place without destroying the promoted primary. Mutually exclusive with restore_to_point_in_time and with password/password_wo (a replica inherits the primary's superuser). After an out-of-band promotion, removing read_replica_of requires declaring password or password_wo, which rotates the promoted primary's superuser password. */
			readReplicaOf?: c.OptionalInput<string>

			/** Cloud region (e.g. 'us-east-1' for AWS or 'us-west1' for GCP). No client-side validation; the server rejects unsupported regions. Required for a standard create; omit for a read replica or point-in-time restore (inherited from the source). */
			region?: c.OptionalInput<string>
			restoreToPointInTime?: c.OptionalInput<{

				/** RFC3339 timestamp to restore to (e.g. '2026-06-01T12:00:00Z'). The server restores to the closest available recovery point at or before this time. */
				restoreTarget: c.Input<string>

				/** ID of the source instance whose backup to restore from. */
				sourceId: c.Input<string>
			}>

			/** Instance size (VM SKU). See https://clickhouse.com/docs/cloud/managed-postgres/scaling for the supported instance families. No client-side enum; the server rejects unsupported sizes with HTTP 400 at apply time. Resizable in place. Required for a standard create; omit for a read replica or point-in-time restore (inherited from the source). */
			size?: c.OptionalInput<string>

			/** Resource tags as a key-value map. Values must be non-empty (server's PATCH returns 400 on omitted value). Set `tags = {}` to clear all tags; omit the attribute to preserve the prior value. */
			tags?: c.OptionalInput<_Record<c.Input<string>>>
		}

		export type ServiceOutput = Readonly<{

			/** Cloud provider hosting the instance. Supported values are 'aws' and 'gcp'. Postgres on GCP is in private preview; contact ClickHouse support to enable access for your organization and region. Required for a standard create; omit for a read replica or point-in-time restore (inherited from the source). */
			cloudProvider: c.Output<string>

			/** RFC3339 timestamp when the service was created. */
			createdAt: c.Output<string>

			/** High-availability mode. One of 'none' (single replica), 'async' (asynchronous replica), or 'sync' (synchronous replica). Mutable post-create; an HA flip triggers a transition. Omitting the attribute preserves the prior value (the server defaults to 'none' on Create); to actively downgrade, set 'ha_type = "none"' explicitly. Omit for a read replica or point-in-time restore (inherited from the source). */
			haType: c.Output<string>

			/** Network hostname for client connections. */
			hostname: c.Output<string>

			/** Unique identifier for the Postgres service. Assigned by ClickHouse Cloud. */
			id: c.Output<string>

			/** IPv4 TCP access list. Omit to preserve existing rules or use the public defaults on creation. An empty list blocks public access on standard creation; on update it removes IPv4 rules only. IPv6 rules are not managed. */
			ipAccess: c.Output<ReadonlyArray<Readonly<{

				/** Description of the IP address. */
				description: string

				/** TCP port or inclusive range from 1 to 65535. Use 5432 for Postgres and 6432 for PgBouncer, or a range such as 5432..6432. */
				portRange: string

				/** IPv4 address or CIDR allowed to connect. Use 0.0.0.0/0 to allow all IPv4 addresses. */
				source: string
			}>>>

			/** True when this instance is a writeable primary cluster; false only for separately-provisioned read replicas. HA standby servers (`ha_type = async`/`sync`) live inside the same primary instance and don't affect this value. */
			isPrimary: c.Output<boolean>

			/** Human-readable name. Immutable post-create; changes force destroy-and-recreate. Differs from clickhouse_service, which allows in-place rename. */
			name: c.Output<string>

			/** Superuser password. Config-owned: the API does not return the password, so Terraform manages exactly the value declared here and never reads it back. One of `password` or `password_wo` is required for a standard service; forbidden for a read replica (it inherits the primary's superuser); optional for a point-in-time restore (omit to keep the source's password, which Terraform then does not track). Changing this value rotates the password (PATCH /password). Must be ≥12 chars with at least one lowercase, one uppercase, and one digit. Stored in (sensitive) state — prefer `password_wo` to keep it out of state. `terraform import` cannot recover the live password — the configured value is rotated in on the first apply after import. */
			password: c.OptionalOutput<string>

			/** Superuser password, write-only: applied to the service but never persisted to Terraform state (requires Terraform >= 1.11). Preferred over `password`. Requires `password_wo_version`; increment the version to rotate to the current `password_wo` value. Same complexity rules as `password`. Forbidden for a read replica. */
			passwordWo: c.OptionalOutput<string>

			/** Version number for `password_wo`. Increment to trigger a password rotation using the current `password_wo` value. */
			passwordWoVersion: c.OptionalOutput<number>

			/** Postgres server parameters (pgConfig) as a key-value map. Declared parameters are the desired state — every apply sends the full map via POST /config (full replacement), so removing a key from the map removes it server-side. Set `pg_config = {}` to clear all parameters; omit the attribute to preserve the prior state (read replicas inherit the primary's parameters, and the server may surface values the configuration never declared — so it is Optional+Computed like tags). Out-of-band changes are reverted on the next apply. Some parameters require a database restart; the provider surfaces the server's restart-required hint as a warning (restart out-of-band). */
			pgConfig: c.Output<Readonly<_Record<string>>>

			/** PgBouncer connection-pooler parameters (pgBouncerConfig) as a key-value map. Same Optional+Computed semantics as pg_config; set `pgbouncer_config = {}` to clear. */
			pgbouncerConfig: c.Output<Readonly<_Record<string>>>

			/** TCP port for client connections. Hardcoded to 5432 today; will become server-supplied once the API exposes a per-instance port field. */
			port: c.Output<number>

			/** Major Postgres version (e.g. '18'). The server picks the patch release within that major. Changing the major triggers destroy-and-recreate. Omit for a read replica or point-in-time restore (inherited from the source). */
			postgresVersion: c.Output<string>

			/** ID of the primary instance to replicate. When set, this instance is created as a read replica (streaming replication) of that primary. Immutable for a live replica: changing or removing it destroys and recreates the instance as a standalone primary. The one exception is an out-of-band promotion — if you promote the replica via the API/UI (is_primary becomes true), changing or removing read_replica_of then reconciles state in place without destroying the promoted primary. Mutually exclusive with restore_to_point_in_time and with password/password_wo (a replica inherits the primary's superuser). After an out-of-band promotion, removing read_replica_of requires declaring password or password_wo, which rotates the promoted primary's superuser password. */
			readReplicaOf: c.OptionalOutput<string>

			/** Cloud region (e.g. 'us-east-1' for AWS or 'us-west1' for GCP). No client-side validation; the server rejects unsupported regions. Required for a standard create; omit for a read replica or point-in-time restore (inherited from the source). */
			region: c.Output<string>
			restoreToPointInTime: c.OptionalOutput<Readonly<{

				/** RFC3339 timestamp to restore to (e.g. '2026-06-01T12:00:00Z'). The server restores to the closest available recovery point at or before this time. */
				restoreTarget: string

				/** ID of the source instance whose backup to restore from. */
				sourceId: string
			}>>

			/** Instance size (VM SKU). See https://clickhouse.com/docs/cloud/managed-postgres/scaling for the supported instance families. No client-side enum; the server rejects unsupported sizes with HTTP 400 at apply time. Resizable in place. Required for a standard create; omit for a read replica or point-in-time restore (inherited from the source). */
			size: c.Output<string>

			/** Server-reported state. Examples: 'creating', 'running', 'restarting', 'unavailable', 'deleting'. Forward-compatible: unknown values from the server are surfaced verbatim. */
			state: c.Output<string>

			/** Resource tags as a key-value map. Values must be non-empty (server's PATCH returns 400 on omitted value). Set `tags = {}` to clear all tags; omit the attribute to preserve the prior value. */
			tags: c.Output<Readonly<_Record<string>>>

			/** Default superuser name. */
			username: c.Output<string>
		}>

		export class Service {

			constructor(parent: c.Group, id: string, props: ServiceInput, config?:c.ResourceConfig)

				readonly [c.nodeMetaSymbol]: c.ResourceMeta

				readonly urn: c.URN


			/** Cloud provider hosting the instance. Supported values are 'aws' and 'gcp'. Postgres on GCP is in private preview; contact ClickHouse support to enable access for your organization and region. Required for a standard create; omit for a read replica or point-in-time restore (inherited from the source). */
			readonly cloudProvider: c.Output<string>

			/** RFC3339 timestamp when the service was created. */
			readonly createdAt: c.Output<string>

			/** High-availability mode. One of 'none' (single replica), 'async' (asynchronous replica), or 'sync' (synchronous replica). Mutable post-create; an HA flip triggers a transition. Omitting the attribute preserves the prior value (the server defaults to 'none' on Create); to actively downgrade, set 'ha_type = "none"' explicitly. Omit for a read replica or point-in-time restore (inherited from the source). */
			readonly haType: c.Output<string>

			/** Network hostname for client connections. */
			readonly hostname: c.Output<string>

			/** Unique identifier for the Postgres service. Assigned by ClickHouse Cloud. */
			readonly id: c.Output<string>

			/** IPv4 TCP access list. Omit to preserve existing rules or use the public defaults on creation. An empty list blocks public access on standard creation; on update it removes IPv4 rules only. IPv6 rules are not managed. */
			readonly ipAccess: c.Output<ReadonlyArray<Readonly<{

				/** Description of the IP address. */
				description: string

				/** TCP port or inclusive range from 1 to 65535. Use 5432 for Postgres and 6432 for PgBouncer, or a range such as 5432..6432. */
				portRange: string

				/** IPv4 address or CIDR allowed to connect. Use 0.0.0.0/0 to allow all IPv4 addresses. */
				source: string
			}>>>

			/** True when this instance is a writeable primary cluster; false only for separately-provisioned read replicas. HA standby servers (`ha_type = async`/`sync`) live inside the same primary instance and don't affect this value. */
			readonly isPrimary: c.Output<boolean>

			/** Human-readable name. Immutable post-create; changes force destroy-and-recreate. Differs from clickhouse_service, which allows in-place rename. */
			readonly name: c.Output<string>

			/** Superuser password. Config-owned: the API does not return the password, so Terraform manages exactly the value declared here and never reads it back. One of `password` or `password_wo` is required for a standard service; forbidden for a read replica (it inherits the primary's superuser); optional for a point-in-time restore (omit to keep the source's password, which Terraform then does not track). Changing this value rotates the password (PATCH /password). Must be ≥12 chars with at least one lowercase, one uppercase, and one digit. Stored in (sensitive) state — prefer `password_wo` to keep it out of state. `terraform import` cannot recover the live password — the configured value is rotated in on the first apply after import. */
			readonly password: c.OptionalOutput<string>

			/** Superuser password, write-only: applied to the service but never persisted to Terraform state (requires Terraform >= 1.11). Preferred over `password`. Requires `password_wo_version`; increment the version to rotate to the current `password_wo` value. Same complexity rules as `password`. Forbidden for a read replica. */
			readonly passwordWo: c.OptionalOutput<string>

			/** Version number for `password_wo`. Increment to trigger a password rotation using the current `password_wo` value. */
			readonly passwordWoVersion: c.OptionalOutput<number>

			/** Postgres server parameters (pgConfig) as a key-value map. Declared parameters are the desired state — every apply sends the full map via POST /config (full replacement), so removing a key from the map removes it server-side. Set `pg_config = {}` to clear all parameters; omit the attribute to preserve the prior state (read replicas inherit the primary's parameters, and the server may surface values the configuration never declared — so it is Optional+Computed like tags). Out-of-band changes are reverted on the next apply. Some parameters require a database restart; the provider surfaces the server's restart-required hint as a warning (restart out-of-band). */
			readonly pgConfig: c.Output<Readonly<_Record<string>>>

			/** PgBouncer connection-pooler parameters (pgBouncerConfig) as a key-value map. Same Optional+Computed semantics as pg_config; set `pgbouncer_config = {}` to clear. */
			readonly pgbouncerConfig: c.Output<Readonly<_Record<string>>>

			/** TCP port for client connections. Hardcoded to 5432 today; will become server-supplied once the API exposes a per-instance port field. */
			readonly port: c.Output<number>

			/** Major Postgres version (e.g. '18'). The server picks the patch release within that major. Changing the major triggers destroy-and-recreate. Omit for a read replica or point-in-time restore (inherited from the source). */
			readonly postgresVersion: c.Output<string>

			/** ID of the primary instance to replicate. When set, this instance is created as a read replica (streaming replication) of that primary. Immutable for a live replica: changing or removing it destroys and recreates the instance as a standalone primary. The one exception is an out-of-band promotion — if you promote the replica via the API/UI (is_primary becomes true), changing or removing read_replica_of then reconciles state in place without destroying the promoted primary. Mutually exclusive with restore_to_point_in_time and with password/password_wo (a replica inherits the primary's superuser). After an out-of-band promotion, removing read_replica_of requires declaring password or password_wo, which rotates the promoted primary's superuser password. */
			readonly readReplicaOf: c.OptionalOutput<string>

			/** Cloud region (e.g. 'us-east-1' for AWS or 'us-west1' for GCP). No client-side validation; the server rejects unsupported regions. Required for a standard create; omit for a read replica or point-in-time restore (inherited from the source). */
			readonly region: c.Output<string>
			readonly restoreToPointInTime: c.OptionalOutput<Readonly<{

				/** RFC3339 timestamp to restore to (e.g. '2026-06-01T12:00:00Z'). The server restores to the closest available recovery point at or before this time. */
				restoreTarget: string

				/** ID of the source instance whose backup to restore from. */
				sourceId: string
			}>>

			/** Instance size (VM SKU). See https://clickhouse.com/docs/cloud/managed-postgres/scaling for the supported instance families. No client-side enum; the server rejects unsupported sizes with HTTP 400 at apply time. Resizable in place. Required for a standard create; omit for a read replica or point-in-time restore (inherited from the source). */
			readonly size: c.Output<string>

			/** Server-reported state. Examples: 'creating', 'running', 'restarting', 'unavailable', 'deleting'. Forward-compatible: unknown values from the server are surfaced verbatim. */
			readonly state: c.Output<string>

			/** Resource tags as a key-value map. Values must be non-empty (server's PATCH returns 400 on omitted value). Set `tags = {}` to clear all tags; omit the attribute to preserve the prior value. */
			readonly tags: c.Output<Readonly<_Record<string>>>

			/** Default superuser name. */
			readonly username: c.Output<string>

		}
	}
	export namespace private {
		export type EndpointRegistrationInput = {

			/** Cloud provider of the private endpoint ID */
			cloudProvider: c.Input<string>

			/** Description of the private endpoint */
			description?: c.OptionalInput<string>

			/** ID of the private endpoint (replaces deprecated attribute `id`) */
			privateEndpointId: c.Input<string>

			/** Region of the private endpoint */
			region: c.Input<string>
		}

		export type EndpointRegistrationOutput = Readonly<{

			/** Cloud provider of the private endpoint ID */
			cloudProvider: c.Output<string>

			/** Description of the private endpoint */
			description: c.OptionalOutput<string>

			/** ID of the private endpoint (replaces deprecated attribute `id`) */
			privateEndpointId: c.Output<string>

			/** Region of the private endpoint */
			region: c.Output<string>
		}>

		export class EndpointRegistration {

			constructor(parent: c.Group, id: string, props: EndpointRegistrationInput, config?:c.ResourceConfig)

				readonly [c.nodeMetaSymbol]: c.ResourceMeta

				readonly urn: c.URN


			/** Cloud provider of the private endpoint ID */
			readonly cloudProvider: c.Output<string>

			/** Description of the private endpoint */
			readonly description: c.OptionalOutput<string>

			/** ID of the private endpoint (replaces deprecated attribute `id`) */
			readonly privateEndpointId: c.Output<string>

			/** Region of the private endpoint */
			readonly region: c.Output<string>

		}
	}
	export namespace query {
		export type ApiEndpointInput = {

			/** Origins allowed by the endpoint CORS policy. Omit this field to restrict access to backend servers. */
			allowedOrigins?: c.OptionalInput<Array<c.Input<string>>>

			/** API key IDs allowed to call the endpoint. */
			apiKeyIds: c.Input<Array<c.Input<string>>>

			/** Database used by the Query API endpoint. */
			database: c.Input<string>

			/** Name of the Query API endpoint. */
			name: c.Input<string>

			/** Default query parameters. */
			parameters?: c.OptionalInput<_Record<c.Input<string>>>

			/** Database roles used to run the query. */
			roles: c.Input<Array<c.Input<string>>>

			/** ID of the ClickHouse Cloud service that runs the query. */
			serviceId: c.Input<string>

			/** SQL executed by the endpoint. */
			sql: c.Input<string>
		}

		export type ApiEndpointOutput = Readonly<{

			/** Origins allowed by the endpoint CORS policy. Omit this field to restrict access to backend servers. */
			allowedOrigins: c.Output<ReadonlyArray<string>>

			/** API key IDs allowed to call the endpoint. */
			apiKeyIds: c.Output<ReadonlyArray<string>>

			/** Database used by the Query API endpoint. */
			database: c.Output<string>

			/** Unique ID of the Query API endpoint. */
			id: c.Output<string>

			/** Name of the Query API endpoint. */
			name: c.Output<string>

			/** Default query parameters. */
			parameters: c.Output<Readonly<_Record<string>>>

			/** Database roles used to run the query. */
			roles: c.Output<ReadonlyArray<string>>

			/** ID of the ClickHouse Cloud service that runs the query. */
			serviceId: c.Output<string>

			/** SQL executed by the endpoint. */
			sql: c.Output<string>

			/** Public URL used to execute the endpoint. */
			url: c.Output<string>
		}>

		export class ApiEndpoint {

			constructor(parent: c.Group, id: string, props: ApiEndpointInput, config?:c.ResourceConfig)

				readonly [c.nodeMetaSymbol]: c.ResourceMeta

				readonly urn: c.URN


			/** Origins allowed by the endpoint CORS policy. Omit this field to restrict access to backend servers. */
			readonly allowedOrigins: c.Output<ReadonlyArray<string>>

			/** API key IDs allowed to call the endpoint. */
			readonly apiKeyIds: c.Output<ReadonlyArray<string>>

			/** Database used by the Query API endpoint. */
			readonly database: c.Output<string>

			/** Unique ID of the Query API endpoint. */
			readonly id: c.Output<string>

			/** Name of the Query API endpoint. */
			readonly name: c.Output<string>

			/** Default query parameters. */
			readonly parameters: c.Output<Readonly<_Record<string>>>

			/** Database roles used to run the query. */
			readonly roles: c.Output<ReadonlyArray<string>>

			/** ID of the ClickHouse Cloud service that runs the query. */
			readonly serviceId: c.Output<string>

			/** SQL executed by the endpoint. */
			readonly sql: c.Output<string>

			/** Public URL used to execute the endpoint. */
			readonly url: c.Output<string>

		}
	}
	export type RoleInput = {

		/** Name of the custom role. */
		name: c.Input<string>

		/** List of policies attached to this role. */
		policies?: c.OptionalInput<Array<c.Input<{

			/** Whether this policy allows or denies the specified permissions. */
			effect: c.Input<string>

			/** List of permission strings granted or denied by this policy. */
			permissions: c.Input<Array<c.Input<string>>>

			/** List of resources this policy applies to. Format: 'instance/<uuid>' or 'instance/*'. */
			resources: c.Input<Array<c.Input<string>>>
			tags?: c.OptionalInput<{

				/** Ordered SQL GRANT and REVOKE statements for custom SQL console access. */
				grants?: c.OptionalInput<Array<c.Input<string>>>

				/** SQL console role level for passwordless DB access. One of: sql-console-admin (full access), sql-console-readonly (read-only). */
				role?: c.OptionalInput<string>
			}>
		}>>>
	}

	export type RoleOutput = Readonly<{

		/** Timestamp when the role was created. */
		createdAt: c.Output<string>

		/** Unique identifier for the role. */
		id: c.Output<string>

		/** Name of the custom role. */
		name: c.Output<string>

		/** Owner ID of this role. */
		ownerId: c.Output<string>

		/** List of policies attached to this role. */
		policies: c.OptionalOutput<ReadonlyArray<Readonly<{

			/** Whether this policy allows or denies the specified permissions. */
			effect: string

			/** Server-assigned policy ID. Changes on every update since the server replaces all policies on PATCH. */
			id: string

			/** List of permission strings granted or denied by this policy. */
			permissions: ReadonlyArray<string>

			/** List of resources this policy applies to. Format: 'instance/<uuid>' or 'instance/*'. */
			resources: ReadonlyArray<string>

			/** ID of the role this policy belongs to. */
			roleId: string
			tags?: Readonly<{

				/** Ordered SQL GRANT and REVOKE statements for custom SQL console access. */
				grants?: ReadonlyArray<string>

				/** SQL console role level for passwordless DB access. One of: sql-console-admin (full access), sql-console-readonly (read-only). */
				role?: string
			}>

			/** Tenant ID that owns this policy. */
			tenantId: string
		}>>>

		/** Tenant ID that owns this role. */
		tenantId: c.Output<string>

		/** Type of the role. Always 'custom' for managed roles. */
		type: c.Output<string>

		/** Timestamp when the role was last updated. */
		updatedAt: c.Output<string>
	}>

	export class Role {

		constructor(parent: c.Group, id: string, props: RoleInput, config?:c.ResourceConfig)

			readonly [c.nodeMetaSymbol]: c.ResourceMeta

			readonly urn: c.URN


		/** Timestamp when the role was created. */
		readonly createdAt: c.Output<string>

		/** Unique identifier for the role. */
		readonly id: c.Output<string>

		/** Name of the custom role. */
		readonly name: c.Output<string>

		/** Owner ID of this role. */
		readonly ownerId: c.Output<string>

		/** List of policies attached to this role. */
		readonly policies: c.OptionalOutput<ReadonlyArray<Readonly<{

			/** Whether this policy allows or denies the specified permissions. */
			effect: string

			/** Server-assigned policy ID. Changes on every update since the server replaces all policies on PATCH. */
			id: string

			/** List of permission strings granted or denied by this policy. */
			permissions: ReadonlyArray<string>

			/** List of resources this policy applies to. Format: 'instance/<uuid>' or 'instance/*'. */
			resources: ReadonlyArray<string>

			/** ID of the role this policy belongs to. */
			roleId: string
			tags?: Readonly<{

				/** Ordered SQL GRANT and REVOKE statements for custom SQL console access. */
				grants?: ReadonlyArray<string>

				/** SQL console role level for passwordless DB access. One of: sql-console-admin (full access), sql-console-readonly (read-only). */
				role?: string
			}>

			/** Tenant ID that owns this policy. */
			tenantId: string
		}>>>

		/** Tenant ID that owns this role. */
		readonly tenantId: c.Output<string>

		/** Type of the role. Always 'custom' for managed roles. */
		readonly type: c.Output<string>

		/** Timestamp when the role was last updated. */
		readonly updatedAt: c.Output<string>

	}
	export namespace role {
		export type AssignmentInput = {

			/** Set of API key IDs to assign to the role. */
			apiKeyIds?: c.OptionalInput<Array<c.Input<string>>>

			/** ID of the role to assign actors to. */
			roleId: c.Input<string>

			/** Set of user IDs to assign to the role. */
			userIds?: c.OptionalInput<Array<c.Input<string>>>
		}

		export type AssignmentOutput = Readonly<{

			/** Set of API key IDs to assign to the role. */
			apiKeyIds: c.OptionalOutput<ReadonlyArray<string>>

			/** Same as role_id. */
			id: c.Output<string>

			/** ID of the role to assign actors to. */
			roleId: c.Output<string>

			/** Set of user IDs to assign to the role. */
			userIds: c.OptionalOutput<ReadonlyArray<string>>
		}>

		export class Assignment {

			constructor(parent: c.Group, id: string, props: AssignmentInput, config?:c.ResourceConfig)

				readonly [c.nodeMetaSymbol]: c.ResourceMeta

				readonly urn: c.URN


			/** Set of API key IDs to assign to the role. */
			readonly apiKeyIds: c.OptionalOutput<ReadonlyArray<string>>

			/** Same as role_id. */
			readonly id: c.Output<string>

			/** ID of the role to assign actors to. */
			readonly roleId: c.Output<string>

			/** Set of user IDs to assign to the role. */
			readonly userIds: c.OptionalOutput<ReadonlyArray<string>>

		}
	}
	export namespace saved {
		export type QueryInput = {

			/** Database used by the saved query. */
			database: c.Input<string>

			/** Name of the saved query. */
			name: c.Input<string>

			/** Default query parameters. */
			parameters?: c.OptionalInput<_Record<c.Input<string>>>

			/** ID of the ClickHouse Cloud service for the saved query. */
			serviceId: c.Input<string>

			/** Saved SQL query. */
			sql: c.Input<string>
		}

		export type QueryOutput = Readonly<{

			/** Database used by the saved query. */
			database: c.Output<string>

			/** Unique ID of the saved query. */
			id: c.Output<string>

			/** Name of the saved query. */
			name: c.Output<string>

			/** Default query parameters. */
			parameters: c.Output<Readonly<_Record<string>>>

			/** ID of the ClickHouse Cloud service for the saved query. */
			serviceId: c.Output<string>

			/** Saved SQL query. */
			sql: c.Output<string>
		}>

		export class Query {

			constructor(parent: c.Group, id: string, props: QueryInput, config?:c.ResourceConfig)

				readonly [c.nodeMetaSymbol]: c.ResourceMeta

				readonly urn: c.URN


			/** Database used by the saved query. */
			readonly database: c.Output<string>

			/** Unique ID of the saved query. */
			readonly id: c.Output<string>

			/** Name of the saved query. */
			readonly name: c.Output<string>

			/** Default query parameters. */
			readonly parameters: c.Output<Readonly<_Record<string>>>

			/** ID of the ClickHouse Cloud service for the saved query. */
			readonly serviceId: c.Output<string>

			/** Saved SQL query. */
			readonly sql: c.Output<string>

		}
	}
	export type ServiceInput = {

		/** Autoscaling mode for the service: "vertical" (fixed replica count, memory scales between min_replica_memory_gb and max_replica_memory_gb) or "horizontal" (replica count scales between min_replicas and max_replicas at fixed per-replica memory, min_replica_memory_gb == max_replica_memory_gb). When omitted on create the mode is inferred from the scaling fields — a distinct min_replicas/max_replicas band is horizontal, otherwise vertical; on an existing service omitting it keeps the current mode. It is unset for development-tier services (which cannot set an autoscaling mode). Horizontal autoscaling must be enabled for your organization. */
		autoscalingMode?: c.OptionalInput<string>
		backupConfiguration?: c.OptionalInput<{

			/** Interval in hours between each backup. */
			backupPeriodInHours?: c.OptionalInput<number>

			/** How long in hours to keep a backup before deleting it. */
			backupRetentionPeriodInHours?: c.OptionalInput<number>

			/** Time of the day in UTC that indicates the start time of a 2 hours window to be used for backup. If set, backup_period_in_hours must be null and backups are created once a day. */
			backupStartTime?: c.OptionalInput<string>
		}>

		/** ID of the backup to restore when creating new service. If specified, the service will be created as a restore operation */
		backupId?: c.OptionalInput<string>

		/** BYOC ID related to the cloud provider account you want to create this service into. When set, the per-replica memory fields (min_replica_memory_gb and max_replica_memory_gb) are required on create — a BYOC service cannot be sized via the deprecated min_total_memory_gb/max_total_memory_gb fields that non-BYOC production services accept. */
		byocId?: c.OptionalInput<string>

		/** Cloud provider ('aws', 'gcp', or 'azure') in which the service is deployed in. */
		cloudProvider: c.Input<string>

		/** Compliance type of the service. Can be 'hipaa', 'pci'. Required for organizations that wish to deploy their services in the hipaa/pci compliant environment. NOTE: hipaa/pci compliance should be enabled for your ClickHouse organization before using this field. */
		complianceType?: c.OptionalInput<string>

		/** Double SHA1 hash of password for connecting with the MySQL protocol. Cannot be specified if `password` or `password_wo` is specified. */
		doubleSha1PasswordHash?: c.OptionalInput<string>

		/** Enable core dumps for the service. */
		enableCoreDumps?: c.OptionalInput<boolean>

		/** Custom role identifier ARN. */
		encryptionAssumedRoleIdentifier?: c.OptionalInput<string>

		/** Custom encryption key ARN. */
		encryptionKey?: c.OptionalInput<string>
		endpoints?: c.OptionalInput<{
			https?: c.OptionalInput<{

			}>
			mysql?: c.OptionalInput<{

				/** Whether to enable the mysql endpoint or not. */
				enabled: c.Input<boolean>
			}>
			nativesecure?: c.OptionalInput<{

			}>
		}>

		/** When set to true the service is allowed to scale down to zero when idle. */
		idleScaling?: c.OptionalInput<boolean>

		/** Set minimum idling timeout (in minutes). Must be greater than or equal to 5 minutes. Must be set if idle_scaling is enabled. */
		idleTimeoutMinutes?: c.OptionalInput<number>

		/** List of IP addresses allowed to access the service. */
		ipAccess: c.Input<Array<c.Input<{

			/** Description of the IP address. */
			description: c.Input<string>

			/** IP address allowed to access the service. In case you want to set the ip_access to anywhere you should set source to 0.0.0.0/0 */
			source: c.Input<string>
		}>>>

		/** Maximum memory of a single replica in GiB. For vertical autoscaling this is the high end of the memory range; for horizontal the API requires it to equal min_replica_memory_gb (per-replica memory is fixed). */
		maxReplicaMemoryGb?: c.OptionalInput<number>

		/** Maximum number of replicas. Horizontal autoscaling only — this is the high end of the replica band. For a vertical service set the replica count with num_replicas instead. Conflicts with num_replicas. */
		maxReplicas?: c.OptionalInput<number>

		/** Maximum total memory of all workers during auto-scaling in GiB. */
		maxTotalMemoryGb?: c.OptionalInput<number>

		/** Minimum memory of a single replica in GiB. For vertical autoscaling this is the low end of the memory range; for horizontal the API requires it to equal max_replica_memory_gb (per-replica memory is fixed). */
		minReplicaMemoryGb?: c.OptionalInput<number>

		/** Minimum number of replicas. Horizontal autoscaling only — this is the low end of the replica band. For a vertical service set the replica count with num_replicas instead (the API reports a vertical count as num_replicas, so a vertical min/max band cannot round-trip). Conflicts with num_replicas. */
		minReplicas?: c.OptionalInput<number>

		/** Minimum total memory of all workers during auto-scaling in GiB. */
		minTotalMemoryGb?: c.OptionalInput<number>

		/** User defined identifier for the service. */
		name: c.Input<string>

		/** Fixed replica count for a vertical service. Conflicts with min_replicas/max_replicas. Forbidden when autoscaling_mode is "horizontal". */
		numReplicas?: c.OptionalInput<number>

		/** Password for the default user. One of either `password`, `password_wo`, or `password_hash` must be specified. */
		password?: c.OptionalInput<string>

		/** SHA256 hash of password for the default user. One of either `password`, `password_wo`, or `password_hash` must be specified. */
		passwordHash?: c.OptionalInput<string>

		/** Password for the default user (write-only, not persisted to state). Use this instead of `password` to avoid storing the password hash in Terraform state. */
		passwordWo?: c.OptionalInput<string>

		/** Version number for password_wo. Increment this to trigger a password update when using password_wo. */
		passwordWoVersion?: c.OptionalInput<number>

		/** Custom instance profile for the service, only available for ENTERPRISE and BYOC organization tiers. BYOC services may use a dynamic BYOC profile configured for their infrastructure (e.g. 'v1-standard-byoc-4'); this requires 'byoc_id' to be set, and 'min_replica_memory_gb' and 'max_replica_memory_gb' must both equal the profile's per-replica memory size. Can only be set at service creation time; changing it forces the service to be replaced. Use the 'available service profiles' OpenAPI endpoint to list the profiles available to your organization. */
		profile?: c.OptionalInput<string>
		queryApiEndpoints?: c.OptionalInput<{

			/** Comma separated list of domain names to be allowed cross-origin resource sharing (CORS) access to the query API. Leave this field empty to restrict access to backend servers only */
			allowedOrigins?: c.OptionalInput<string>

			/** The UUIDs of the API Keys to grant access to the query API. */
			apiKeyIds: c.Input<Array<c.Input<string>>>

			/** The Database role that will be used to run the query. */
			roles: c.Input<Array<c.Input<string>>>
		}>

		/** Indicates if this service should be read only. Only allowed for secondary services, those which share data with another service (i.e. when `warehouse_id` field is set). */
		readonly?: c.OptionalInput<boolean>

		/** Region within the cloud provider in which the service is deployed in. */
		region: c.Input<string>

		/** Release channel to use for this service. Can be 'default', 'fast' or 'slow'. */
		releaseChannel?: c.OptionalInput<string>
		snapshotConfiguration?: c.OptionalInput<{

			/** Whether scheduled snapshots are enabled for the service. When true, gap and time_frame are required. */
			enabled: c.Input<boolean>

			/** Interval in minutes between snapshots. Required when enabled, and paired with time_frame: only the presets (gap 30, time_frame 1440) and (gap 60, time_frame 2880) are accepted. */
			gap?: c.OptionalInput<number>

			/** Retention window in minutes the snapshots cover. Required when enabled, and paired with gap: only the presets (gap 30, time_frame 1440) and (gap 60, time_frame 2880) are accepted. */
			timeFrame?: c.OptionalInput<number>
		}>

		/** Tags associated with the service as key-value pairs. */
		tags?: c.OptionalInput<_Record<c.Input<string>>>

		/** Tier of the service: 'development', 'production'. Required for organizations using the Legacy ClickHouse Cloud Tiers, must be omitted for organizations using the new ClickHouse Cloud Tiers. */
		tier?: c.OptionalInput<string>
		transparentDataEncryption?: c.OptionalInput<{

			/** If true, TDE is enabled for the service. */
			enabled?: c.OptionalInput<boolean>
		}>

		/** Set it to the 'warehouse_id' attribute of another service to share the data with it. The service must be in the same cloud and region. */
		warehouseId?: c.OptionalInput<string>
	}

	export type ServiceOutput = Readonly<{

		/** Autoscaling mode for the service: "vertical" (fixed replica count, memory scales between min_replica_memory_gb and max_replica_memory_gb) or "horizontal" (replica count scales between min_replicas and max_replicas at fixed per-replica memory, min_replica_memory_gb == max_replica_memory_gb). When omitted on create the mode is inferred from the scaling fields — a distinct min_replicas/max_replicas band is horizontal, otherwise vertical; on an existing service omitting it keeps the current mode. It is unset for development-tier services (which cannot set an autoscaling mode). Horizontal autoscaling must be enabled for your organization. */
		autoscalingMode: c.Output<string>
		backupConfiguration: c.Output<Readonly<{

			/** Interval in hours between each backup. */
			backupPeriodInHours: number

			/** How long in hours to keep a backup before deleting it. */
			backupRetentionPeriodInHours: number

			/** Time of the day in UTC that indicates the start time of a 2 hours window to be used for backup. If set, backup_period_in_hours must be null and backups are created once a day. */
			backupStartTime: string
		}>>

		/** ID of the backup to restore when creating new service. If specified, the service will be created as a restore operation */
		backupId: c.OptionalOutput<string>

		/** BYOC ID related to the cloud provider account you want to create this service into. When set, the per-replica memory fields (min_replica_memory_gb and max_replica_memory_gb) are required on create — a BYOC service cannot be sized via the deprecated min_total_memory_gb/max_total_memory_gb fields that non-BYOC production services accept. */
		byocId: c.OptionalOutput<string>

		/** Cloud provider ('aws', 'gcp', or 'azure') in which the service is deployed in. */
		cloudProvider: c.Output<string>

		/** Compliance type of the service. Can be 'hipaa', 'pci'. Required for organizations that wish to deploy their services in the hipaa/pci compliant environment. NOTE: hipaa/pci compliance should be enabled for your ClickHouse organization before using this field. */
		complianceType: c.OptionalOutput<string>

		/** Double SHA1 hash of password for connecting with the MySQL protocol. Cannot be specified if `password` or `password_wo` is specified. */
		doubleSha1PasswordHash: c.OptionalOutput<string>

		/** Enable core dumps for the service. */
		enableCoreDumps: c.Output<boolean>

		/** Custom role identifier ARN. */
		encryptionAssumedRoleIdentifier: c.OptionalOutput<string>

		/** Custom encryption key ARN. */
		encryptionKey: c.Output<string>
		endpoints: c.Output<Readonly<{
			https: Readonly<{

				/** Endpoint host. */
				host: string

				/** Endpoint port. */
				port: number
			}>
			mysql: Readonly<{

				/** Whether to enable the mysql endpoint or not. */
				enabled: boolean

				/** Endpoint host. */
				host: string

				/** Endpoint port. */
				port: number
			}>
			nativesecure: Readonly<{

				/** Endpoint host. */
				host: string

				/** Endpoint port. */
				port: number
			}>
		}>>

		/** The password ClickHouse assigned to the default user at creation, when you don't supply your own (`password` and `password_hash` unset, and `password_wo = ""`).

To use this: set `password_wo = ""` and `password_wo_version` (e.g. `1`) — the schema still requires one of `password`/`password_hash`/`password_wo` to be set, so this is how you opt into an auto-generated password instead of choosing your own.

Only set right after creation. It goes blank again if you later change the password through this provider, and it isn't updated if the password changes outside Terraform (console, another tool) — so treat it as a one-time value to capture at creation, not a live mirror of the current password.

Useful when the caller creating the service shouldn't need permission to reset its password afterward. */
		generatedPassword: c.Output<string>

		/** IAM role used for accessing objects in s3. */
		iamRole: c.Output<string>

		/** ID of the created service. Generated by ClickHouse Cloud. */
		id: c.Output<string>

		/** When set to true the service is allowed to scale down to zero when idle. */
		idleScaling: c.Output<boolean>

		/** Set minimum idling timeout (in minutes). Must be greater than or equal to 5 minutes. Must be set if idle_scaling is enabled. */
		idleTimeoutMinutes: c.Output<number>

		/** List of IP addresses allowed to access the service. */
		ipAccess: c.Output<ReadonlyArray<Readonly<{

			/** Description of the IP address. */
			description: string

			/** IP address allowed to access the service. In case you want to set the ip_access to anywhere you should set source to 0.0.0.0/0 */
			source: string
		}>>>

		/** If true, it indicates this is a primary service using its own data. If false it means this service is a secondary service, thus using data from a warehouse. */
		isPrimary: c.Output<boolean>

		/** Maximum memory of a single replica in GiB. For vertical autoscaling this is the high end of the memory range; for horizontal the API requires it to equal min_replica_memory_gb (per-replica memory is fixed). */
		maxReplicaMemoryGb: c.Output<number>

		/** Maximum number of replicas. Horizontal autoscaling only — this is the high end of the replica band. For a vertical service set the replica count with num_replicas instead. Conflicts with num_replicas. */
		maxReplicas: c.Output<number>

		/** Maximum total memory of all workers during auto-scaling in GiB. */
		maxTotalMemoryGb: c.OptionalOutput<number>

		/** Minimum memory of a single replica in GiB. For vertical autoscaling this is the low end of the memory range; for horizontal the API requires it to equal max_replica_memory_gb (per-replica memory is fixed). */
		minReplicaMemoryGb: c.Output<number>

		/** Minimum number of replicas. Horizontal autoscaling only — this is the low end of the replica band. For a vertical service set the replica count with num_replicas instead (the API reports a vertical count as num_replicas, so a vertical min/max band cannot round-trip). Conflicts with num_replicas. */
		minReplicas: c.Output<number>

		/** Minimum total memory of all workers during auto-scaling in GiB. */
		minTotalMemoryGb: c.OptionalOutput<number>

		/** User defined identifier for the service. */
		name: c.Output<string>

		/** Fixed replica count for a vertical service. Conflicts with min_replicas/max_replicas. Forbidden when autoscaling_mode is "horizontal". */
		numReplicas: c.Output<number>

		/** Password for the default user. One of either `password`, `password_wo`, or `password_hash` must be specified. */
		password: c.OptionalOutput<string>

		/** SHA256 hash of password for the default user. One of either `password`, `password_wo`, or `password_hash` must be specified. */
		passwordHash: c.OptionalOutput<string>

		/** Password for the default user (write-only, not persisted to state). Use this instead of `password` to avoid storing the password hash in Terraform state. */
		passwordWo: c.OptionalOutput<string>

		/** Version number for password_wo. Increment this to trigger a password update when using password_wo. */
		passwordWoVersion: c.OptionalOutput<number>
		privateEndpointConfig: c.Output<Readonly<{

			/** Unique identifier of the interface endpoint you created in your VPC with the AWS(Service Name) or GCP(Target Service) resource. */
			endpointServiceId: string

			/** Private DNS Hostname of the VPC you created. */
			privateDnsHostname: string
		}>>

		/** Custom instance profile for the service, only available for ENTERPRISE and BYOC organization tiers. BYOC services may use a dynamic BYOC profile configured for their infrastructure (e.g. 'v1-standard-byoc-4'); this requires 'byoc_id' to be set, and 'min_replica_memory_gb' and 'max_replica_memory_gb' must both equal the profile's per-replica memory size. Can only be set at service creation time; changing it forces the service to be replaced. Use the 'available service profiles' OpenAPI endpoint to list the profiles available to your organization. */
		profile: c.Output<string>
		queryApiEndpoints: c.OptionalOutput<Readonly<{

			/** Comma separated list of domain names to be allowed cross-origin resource sharing (CORS) access to the query API. Leave this field empty to restrict access to backend servers only */
			allowedOrigins: string

			/** The UUIDs of the API Keys to grant access to the query API. */
			apiKeyIds: ReadonlyArray<string>

			/** The Database role that will be used to run the query. */
			roles: ReadonlyArray<string>
		}>>

		/** Indicates if this service should be read only. Only allowed for secondary services, those which share data with another service (i.e. when `warehouse_id` field is set). */
		readonly: c.Output<boolean>

		/** Region within the cloud provider in which the service is deployed in. */
		region: c.Output<string>

		/** Release channel to use for this service. Can be 'default', 'fast' or 'slow'. */
		releaseChannel: c.Output<string>
		snapshotConfiguration: c.Output<Readonly<{

			/** Whether scheduled snapshots are enabled for the service. When true, gap and time_frame are required. */
			enabled: boolean

			/** Interval in minutes between snapshots. Required when enabled, and paired with time_frame: only the presets (gap 30, time_frame 1440) and (gap 60, time_frame 2880) are accepted. */
			gap: number

			/** Retention window in minutes the snapshots cover. Required when enabled, and paired with gap: only the presets (gap 30, time_frame 1440) and (gap 60, time_frame 2880) are accepted. */
			timeFrame: number
		}>>

		/** Tags associated with the service as key-value pairs. */
		tags: c.OptionalOutput<Readonly<_Record<string>>>

		/** Tier of the service: 'development', 'production'. Required for organizations using the Legacy ClickHouse Cloud Tiers, must be omitted for organizations using the new ClickHouse Cloud Tiers. */
		tier: c.OptionalOutput<string>
		transparentDataEncryption: c.Output<Readonly<{

			/** If true, TDE is enabled for the service. */
			enabled: boolean

			/** ID of Role to be used for granting access to the Encryption Key. This is an ARN for AWS services and a Service Account Identifier for GCP. */
			roleId: string
		}>>

		/** Set it to the 'warehouse_id' attribute of another service to share the data with it. The service must be in the same cloud and region. */
		warehouseId: c.Output<string>
	}>

	export class Service {

		constructor(parent: c.Group, id: string, props: ServiceInput, config?:c.ResourceConfig)

			readonly [c.nodeMetaSymbol]: c.ResourceMeta

			readonly urn: c.URN


		/** Autoscaling mode for the service: "vertical" (fixed replica count, memory scales between min_replica_memory_gb and max_replica_memory_gb) or "horizontal" (replica count scales between min_replicas and max_replicas at fixed per-replica memory, min_replica_memory_gb == max_replica_memory_gb). When omitted on create the mode is inferred from the scaling fields — a distinct min_replicas/max_replicas band is horizontal, otherwise vertical; on an existing service omitting it keeps the current mode. It is unset for development-tier services (which cannot set an autoscaling mode). Horizontal autoscaling must be enabled for your organization. */
		readonly autoscalingMode: c.Output<string>
		readonly backupConfiguration: c.Output<Readonly<{

			/** Interval in hours between each backup. */
			backupPeriodInHours: number

			/** How long in hours to keep a backup before deleting it. */
			backupRetentionPeriodInHours: number

			/** Time of the day in UTC that indicates the start time of a 2 hours window to be used for backup. If set, backup_period_in_hours must be null and backups are created once a day. */
			backupStartTime: string
		}>>

		/** ID of the backup to restore when creating new service. If specified, the service will be created as a restore operation */
		readonly backupId: c.OptionalOutput<string>

		/** BYOC ID related to the cloud provider account you want to create this service into. When set, the per-replica memory fields (min_replica_memory_gb and max_replica_memory_gb) are required on create — a BYOC service cannot be sized via the deprecated min_total_memory_gb/max_total_memory_gb fields that non-BYOC production services accept. */
		readonly byocId: c.OptionalOutput<string>

		/** Cloud provider ('aws', 'gcp', or 'azure') in which the service is deployed in. */
		readonly cloudProvider: c.Output<string>

		/** Compliance type of the service. Can be 'hipaa', 'pci'. Required for organizations that wish to deploy their services in the hipaa/pci compliant environment. NOTE: hipaa/pci compliance should be enabled for your ClickHouse organization before using this field. */
		readonly complianceType: c.OptionalOutput<string>

		/** Double SHA1 hash of password for connecting with the MySQL protocol. Cannot be specified if `password` or `password_wo` is specified. */
		readonly doubleSha1PasswordHash: c.OptionalOutput<string>

		/** Enable core dumps for the service. */
		readonly enableCoreDumps: c.Output<boolean>

		/** Custom role identifier ARN. */
		readonly encryptionAssumedRoleIdentifier: c.OptionalOutput<string>

		/** Custom encryption key ARN. */
		readonly encryptionKey: c.Output<string>
		readonly endpoints: c.Output<Readonly<{
			https: Readonly<{

				/** Endpoint host. */
				host: string

				/** Endpoint port. */
				port: number
			}>
			mysql: Readonly<{

				/** Whether to enable the mysql endpoint or not. */
				enabled: boolean

				/** Endpoint host. */
				host: string

				/** Endpoint port. */
				port: number
			}>
			nativesecure: Readonly<{

				/** Endpoint host. */
				host: string

				/** Endpoint port. */
				port: number
			}>
		}>>

		/** The password ClickHouse assigned to the default user at creation, when you don't supply your own (`password` and `password_hash` unset, and `password_wo = ""`).

To use this: set `password_wo = ""` and `password_wo_version` (e.g. `1`) — the schema still requires one of `password`/`password_hash`/`password_wo` to be set, so this is how you opt into an auto-generated password instead of choosing your own.

Only set right after creation. It goes blank again if you later change the password through this provider, and it isn't updated if the password changes outside Terraform (console, another tool) — so treat it as a one-time value to capture at creation, not a live mirror of the current password.

Useful when the caller creating the service shouldn't need permission to reset its password afterward. */
		readonly generatedPassword: c.Output<string>

		/** IAM role used for accessing objects in s3. */
		readonly iamRole: c.Output<string>

		/** ID of the created service. Generated by ClickHouse Cloud. */
		readonly id: c.Output<string>

		/** When set to true the service is allowed to scale down to zero when idle. */
		readonly idleScaling: c.Output<boolean>

		/** Set minimum idling timeout (in minutes). Must be greater than or equal to 5 minutes. Must be set if idle_scaling is enabled. */
		readonly idleTimeoutMinutes: c.Output<number>

		/** List of IP addresses allowed to access the service. */
		readonly ipAccess: c.Output<ReadonlyArray<Readonly<{

			/** Description of the IP address. */
			description: string

			/** IP address allowed to access the service. In case you want to set the ip_access to anywhere you should set source to 0.0.0.0/0 */
			source: string
		}>>>

		/** If true, it indicates this is a primary service using its own data. If false it means this service is a secondary service, thus using data from a warehouse. */
		readonly isPrimary: c.Output<boolean>

		/** Maximum memory of a single replica in GiB. For vertical autoscaling this is the high end of the memory range; for horizontal the API requires it to equal min_replica_memory_gb (per-replica memory is fixed). */
		readonly maxReplicaMemoryGb: c.Output<number>

		/** Maximum number of replicas. Horizontal autoscaling only — this is the high end of the replica band. For a vertical service set the replica count with num_replicas instead. Conflicts with num_replicas. */
		readonly maxReplicas: c.Output<number>

		/** Maximum total memory of all workers during auto-scaling in GiB. */
		readonly maxTotalMemoryGb: c.OptionalOutput<number>

		/** Minimum memory of a single replica in GiB. For vertical autoscaling this is the low end of the memory range; for horizontal the API requires it to equal max_replica_memory_gb (per-replica memory is fixed). */
		readonly minReplicaMemoryGb: c.Output<number>

		/** Minimum number of replicas. Horizontal autoscaling only — this is the low end of the replica band. For a vertical service set the replica count with num_replicas instead (the API reports a vertical count as num_replicas, so a vertical min/max band cannot round-trip). Conflicts with num_replicas. */
		readonly minReplicas: c.Output<number>

		/** Minimum total memory of all workers during auto-scaling in GiB. */
		readonly minTotalMemoryGb: c.OptionalOutput<number>

		/** User defined identifier for the service. */
		readonly name: c.Output<string>

		/** Fixed replica count for a vertical service. Conflicts with min_replicas/max_replicas. Forbidden when autoscaling_mode is "horizontal". */
		readonly numReplicas: c.Output<number>

		/** Password for the default user. One of either `password`, `password_wo`, or `password_hash` must be specified. */
		readonly password: c.OptionalOutput<string>

		/** SHA256 hash of password for the default user. One of either `password`, `password_wo`, or `password_hash` must be specified. */
		readonly passwordHash: c.OptionalOutput<string>

		/** Password for the default user (write-only, not persisted to state). Use this instead of `password` to avoid storing the password hash in Terraform state. */
		readonly passwordWo: c.OptionalOutput<string>

		/** Version number for password_wo. Increment this to trigger a password update when using password_wo. */
		readonly passwordWoVersion: c.OptionalOutput<number>
		readonly privateEndpointConfig: c.Output<Readonly<{

			/** Unique identifier of the interface endpoint you created in your VPC with the AWS(Service Name) or GCP(Target Service) resource. */
			endpointServiceId: string

			/** Private DNS Hostname of the VPC you created. */
			privateDnsHostname: string
		}>>

		/** Custom instance profile for the service, only available for ENTERPRISE and BYOC organization tiers. BYOC services may use a dynamic BYOC profile configured for their infrastructure (e.g. 'v1-standard-byoc-4'); this requires 'byoc_id' to be set, and 'min_replica_memory_gb' and 'max_replica_memory_gb' must both equal the profile's per-replica memory size. Can only be set at service creation time; changing it forces the service to be replaced. Use the 'available service profiles' OpenAPI endpoint to list the profiles available to your organization. */
		readonly profile: c.Output<string>
		readonly queryApiEndpoints: c.OptionalOutput<Readonly<{

			/** Comma separated list of domain names to be allowed cross-origin resource sharing (CORS) access to the query API. Leave this field empty to restrict access to backend servers only */
			allowedOrigins: string

			/** The UUIDs of the API Keys to grant access to the query API. */
			apiKeyIds: ReadonlyArray<string>

			/** The Database role that will be used to run the query. */
			roles: ReadonlyArray<string>
		}>>

		/** Indicates if this service should be read only. Only allowed for secondary services, those which share data with another service (i.e. when `warehouse_id` field is set). */
		readonly readonly: c.Output<boolean>

		/** Region within the cloud provider in which the service is deployed in. */
		readonly region: c.Output<string>

		/** Release channel to use for this service. Can be 'default', 'fast' or 'slow'. */
		readonly releaseChannel: c.Output<string>
		readonly snapshotConfiguration: c.Output<Readonly<{

			/** Whether scheduled snapshots are enabled for the service. When true, gap and time_frame are required. */
			enabled: boolean

			/** Interval in minutes between snapshots. Required when enabled, and paired with time_frame: only the presets (gap 30, time_frame 1440) and (gap 60, time_frame 2880) are accepted. */
			gap: number

			/** Retention window in minutes the snapshots cover. Required when enabled, and paired with gap: only the presets (gap 30, time_frame 1440) and (gap 60, time_frame 2880) are accepted. */
			timeFrame: number
		}>>

		/** Tags associated with the service as key-value pairs. */
		readonly tags: c.OptionalOutput<Readonly<_Record<string>>>

		/** Tier of the service: 'development', 'production'. Required for organizations using the Legacy ClickHouse Cloud Tiers, must be omitted for organizations using the new ClickHouse Cloud Tiers. */
		readonly tier: c.OptionalOutput<string>
		readonly transparentDataEncryption: c.Output<Readonly<{

			/** If true, TDE is enabled for the service. */
			enabled: boolean

			/** ID of Role to be used for granting access to the Encryption Key. This is an ARN for AWS services and a Service Account Identifier for GCP. */
			roleId: string
		}>>

		/** Set it to the 'warehouse_id' attribute of another service to share the data with it. The service must be in the same cloud and region. */
		readonly warehouseId: c.Output<string>

	}
	export namespace service {
		export type PrivateEndpointsAttachmentInput = {

			/** List of private endpoint IDs */
			privateEndpointIds?: c.OptionalInput<Array<c.Input<string>>>

			/** ClickHouse Service ID */
			serviceId?: c.OptionalInput<string>
		}

		export type PrivateEndpointsAttachmentOutput = Readonly<{

			/** List of private endpoint IDs */
			privateEndpointIds: c.Output<ReadonlyArray<string>>

			/** ClickHouse Service ID */
			serviceId: c.OptionalOutput<string>
		}>

		export class PrivateEndpointsAttachment {

			constructor(parent: c.Group, id: string, props: PrivateEndpointsAttachmentInput, config?:c.ResourceConfig)

				readonly [c.nodeMetaSymbol]: c.ResourceMeta

				readonly urn: c.URN


			/** List of private endpoint IDs */
			readonly privateEndpointIds: c.Output<ReadonlyArray<string>>

			/** ClickHouse Service ID */
			readonly serviceId: c.OptionalOutput<string>

		}
		export type ScheduledScalingInput = {

			/** Recurring scaling windows. The server rejects any pair of entries that overlap in time, so at most one window is active at any moment; otherwise base_config applies. */
			entries: c.Input<Array<c.Input<{

				/** Autoscaling mode while the window is active: "vertical" (fixed replica count via min_replicas == max_replicas, memory scales between min_replica_memory_gb and max_replica_memory_gb) or "horizontal" (replica count scales between min_replicas and max_replicas at fixed per-replica memory, min_replica_memory_gb == max_replica_memory_gb). When omitted the server defaults to vertical, so a distinct min_replicas/max_replicas band requires an explicit autoscaling_mode = "horizontal". The schedule update is a full replace and per-entry mode is not preserved across updates, so set autoscaling_mode explicitly on every entry you want to keep horizontal. */
				autoscalingMode?: c.OptionalInput<string>

				/** End hour in UTC (1-24). Must differ from start_hour_utc. Note the asymmetric range: end_hour_utc=0 is invalid; use end_hour_utc=24 to mean midnight at end of day. */
				endHourUtc: c.Input<number>

				/** Whether idle scaling is enabled while the window is active. */
				idleScaling?: c.OptionalInput<boolean>

				/** Minutes of inactivity before the service scales to zero. Must be at least 5. Only meaningful when idle_scaling is true. */
				idleTimeoutMinutes?: c.OptionalInput<number>

				/** Maximum memory per replica in GiB. Must be set together with min_replica_memory_gb. */
				maxReplicaMemoryGb?: c.OptionalInput<number>

				/** Maximum replica count while the window is active. For a vertical entry min_replicas must equal max_replicas (fixed count); for a horizontal entry it is the high end of the replica band. */
				maxReplicas?: c.OptionalInput<number>

				/** Minimum memory per replica in GiB. Must be set together with max_replica_memory_gb. */
				minReplicaMemoryGb?: c.OptionalInput<number>

				/** Minimum replica count while the window is active. For a vertical entry min_replicas must equal max_replicas (fixed count); for a horizontal entry it is the low end of the replica band. */
				minReplicas?: c.OptionalInput<number>

				/** Human-readable name for the entry (e.g. "Business hours"). */
				name: c.Input<string>

				/** Start hour in UTC (0-23). If end_hour_utc < start_hour_utc the window wraps overnight. Set start_hour_utc=0 and end_hour_utc=24 for a 24-hour window. */
				startHourUtc: c.Input<number>

				/** Weekdays this entry covers. 0 = Sunday … 6 = Saturday. */
				weekdays: c.Input<Array<c.Input<number>>>
			}>>>

			/** ClickHouse Cloud service ID this schedule applies to. */
			serviceId: c.Input<string>
		}

		export type ScheduledScalingOutput = Readonly<{
			baseConfig: c.Output<Readonly<{
				autoscalingMode: string
				idleScaling: boolean
				idleTimeoutMinutes: number
				maxReplicaMemoryGb: number
				maxReplicas: number
				minReplicaMemoryGb: number
				minReplicas: number
			}>>

			/** Recurring scaling windows. The server rejects any pair of entries that overlap in time, so at most one window is active at any moment; otherwise base_config applies. */
			entries: c.Output<ReadonlyArray<Readonly<{

				/** Autoscaling mode while the window is active: "vertical" (fixed replica count via min_replicas == max_replicas, memory scales between min_replica_memory_gb and max_replica_memory_gb) or "horizontal" (replica count scales between min_replicas and max_replicas at fixed per-replica memory, min_replica_memory_gb == max_replica_memory_gb). When omitted the server defaults to vertical, so a distinct min_replicas/max_replicas band requires an explicit autoscaling_mode = "horizontal". The schedule update is a full replace and per-entry mode is not preserved across updates, so set autoscaling_mode explicitly on every entry you want to keep horizontal. */
				autoscalingMode: string

				/** End hour in UTC (1-24). Must differ from start_hour_utc. Note the asymmetric range: end_hour_utc=0 is invalid; use end_hour_utc=24 to mean midnight at end of day. */
				endHourUtc: number

				/** Whether idle scaling is enabled while the window is active. */
				idleScaling: boolean

				/** Minutes of inactivity before the service scales to zero. Must be at least 5. Only meaningful when idle_scaling is true. */
				idleTimeoutMinutes: number

				/** Maximum memory per replica in GiB. Must be set together with min_replica_memory_gb. */
				maxReplicaMemoryGb: number

				/** Maximum replica count while the window is active. For a vertical entry min_replicas must equal max_replicas (fixed count); for a horizontal entry it is the high end of the replica band. */
				maxReplicas: number

				/** Minimum memory per replica in GiB. Must be set together with max_replica_memory_gb. */
				minReplicaMemoryGb: number

				/** Minimum replica count while the window is active. For a vertical entry min_replicas must equal max_replicas (fixed count); for a horizontal entry it is the low end of the replica band. */
				minReplicas: number

				/** Human-readable name for the entry (e.g. "Business hours"). */
				name: string

				/** Start hour in UTC (0-23). If end_hour_utc < start_hour_utc the window wraps overnight. Set start_hour_utc=0 and end_hour_utc=24 for a 24-hour window. */
				startHourUtc: number

				/** Weekdays this entry covers. 0 = Sunday … 6 = Saturday. */
				weekdays: ReadonlyArray<number>
			}>>>

			/** Resource identifier. Equal to service_id (one schedule per service). */
			id: c.Output<string>

			/** ClickHouse Cloud service ID this schedule applies to. */
			serviceId: c.Output<string>
		}>

		export class ScheduledScaling {

			constructor(parent: c.Group, id: string, props: ScheduledScalingInput, config?:c.ResourceConfig)

				readonly [c.nodeMetaSymbol]: c.ResourceMeta

				readonly urn: c.URN

			readonly baseConfig: c.Output<Readonly<{
				autoscalingMode: string
				idleScaling: boolean
				idleTimeoutMinutes: number
				maxReplicaMemoryGb: number
				maxReplicas: number
				minReplicaMemoryGb: number
				minReplicas: number
			}>>

			/** Recurring scaling windows. The server rejects any pair of entries that overlap in time, so at most one window is active at any moment; otherwise base_config applies. */
			readonly entries: c.Output<ReadonlyArray<Readonly<{

				/** Autoscaling mode while the window is active: "vertical" (fixed replica count via min_replicas == max_replicas, memory scales between min_replica_memory_gb and max_replica_memory_gb) or "horizontal" (replica count scales between min_replicas and max_replicas at fixed per-replica memory, min_replica_memory_gb == max_replica_memory_gb). When omitted the server defaults to vertical, so a distinct min_replicas/max_replicas band requires an explicit autoscaling_mode = "horizontal". The schedule update is a full replace and per-entry mode is not preserved across updates, so set autoscaling_mode explicitly on every entry you want to keep horizontal. */
				autoscalingMode: string

				/** End hour in UTC (1-24). Must differ from start_hour_utc. Note the asymmetric range: end_hour_utc=0 is invalid; use end_hour_utc=24 to mean midnight at end of day. */
				endHourUtc: number

				/** Whether idle scaling is enabled while the window is active. */
				idleScaling: boolean

				/** Minutes of inactivity before the service scales to zero. Must be at least 5. Only meaningful when idle_scaling is true. */
				idleTimeoutMinutes: number

				/** Maximum memory per replica in GiB. Must be set together with min_replica_memory_gb. */
				maxReplicaMemoryGb: number

				/** Maximum replica count while the window is active. For a vertical entry min_replicas must equal max_replicas (fixed count); for a horizontal entry it is the high end of the replica band. */
				maxReplicas: number

				/** Minimum memory per replica in GiB. Must be set together with max_replica_memory_gb. */
				minReplicaMemoryGb: number

				/** Minimum replica count while the window is active. For a vertical entry min_replicas must equal max_replicas (fixed count); for a horizontal entry it is the low end of the replica band. */
				minReplicas: number

				/** Human-readable name for the entry (e.g. "Business hours"). */
				name: string

				/** Start hour in UTC (0-23). If end_hour_utc < start_hour_utc the window wraps overnight. Set start_hour_utc=0 and end_hour_utc=24 for a 24-hour window. */
				startHourUtc: number

				/** Weekdays this entry covers. 0 = Sunday … 6 = Saturday. */
				weekdays: ReadonlyArray<number>
			}>>>

			/** Resource identifier. Equal to service_id (one schedule per service). */
			readonly id: c.Output<string>

			/** ClickHouse Cloud service ID this schedule applies to. */
			readonly serviceId: c.Output<string>

		}
		export type TransparentDataEncryptionKeyAssociationInput = {

			/** ID of the Encryption key to use for data encryption. Must be an ARN for AWS services or a Key Resource Path for GCP services. */
			keyId: c.Input<string>

			/** ClickHouse Service ID */
			serviceId: c.Input<string>
		}

		export type TransparentDataEncryptionKeyAssociationOutput = Readonly<{

			/** ID of the Encryption key to use for data encryption. Must be an ARN for AWS services or a Key Resource Path for GCP services. */
			keyId: c.Output<string>

			/** ClickHouse Service ID */
			serviceId: c.Output<string>
		}>

		export class TransparentDataEncryptionKeyAssociation {

			constructor(parent: c.Group, id: string, props: TransparentDataEncryptionKeyAssociationInput, config?:c.ResourceConfig)

				readonly [c.nodeMetaSymbol]: c.ResourceMeta

				readonly urn: c.URN


			/** ID of the Encryption key to use for data encryption. Must be an ARN for AWS services or a Key Resource Path for GCP services. */
			readonly keyId: c.Output<string>

			/** ClickHouse Service ID */
			readonly serviceId: c.Output<string>

		}
		export type UpgradeWindowInput = {

			/** ClickHouse Cloud service ID this upgrade window applies to. */
			serviceId: c.Input<string>

			/** UTC hour when the upgrade window starts. Must be one of 0, 6, 12, or 18. */
			startHourUtc: c.Input<number>

			/** Day of the week the upgrade window starts. 0 = Sunday, 1 = Monday, …, 6 = Saturday. */
			weekday: c.Input<number>
		}

		export type UpgradeWindowOutput = Readonly<{

			/** Length of the upgrade window in hours. Server-controlled; currently always 6. */
			duration: c.Output<number>

			/** Resource identifier. Equal to service_id (one window per service). */
			id: c.Output<string>

			/** ClickHouse Cloud service ID this upgrade window applies to. */
			serviceId: c.Output<string>

			/** UTC hour when the upgrade window starts. Must be one of 0, 6, 12, or 18. */
			startHourUtc: c.Output<number>

			/** Day of the week the upgrade window starts. 0 = Sunday, 1 = Monday, …, 6 = Saturday. */
			weekday: c.Output<number>
		}>

		export class UpgradeWindow {

			constructor(parent: c.Group, id: string, props: UpgradeWindowInput, config?:c.ResourceConfig)

				readonly [c.nodeMetaSymbol]: c.ResourceMeta

				readonly urn: c.URN


			/** Length of the upgrade window in hours. Server-controlled; currently always 6. */
			readonly duration: c.Output<number>

			/** Resource identifier. Equal to service_id (one window per service). */
			readonly id: c.Output<string>

			/** ClickHouse Cloud service ID this upgrade window applies to. */
			readonly serviceId: c.Output<string>

			/** UTC hour when the upgrade window starts. Must be one of 0, 6, 12, or 18. */
			readonly startHourUtc: c.Output<number>

			/** Day of the week the upgrade window starts. 0 = Sunday, 1 = Monday, …, 6 = Saturday. */
			readonly weekday: c.Output<number>

		}
	}
	export type UdfInput = {

		/** Arguments passed to the UDF command. */
		arguments: c.Input<Array<c.Input<{

			/** Name of the argument. Required for Native and JSONEachRow formats. */
			name: c.Input<string>

			/** ClickHouse data type of the argument. */
			type: c.Input<string>
		}>>>

		/** Command stdout read timeout in milliseconds. */
		commandReadTimeout?: c.OptionalInput<number>

		/** Command stdin write timeout in milliseconds. */
		commandWriteTimeout?: c.OptionalInput<number>

		/** When true (the default), a failed build fails the apply. The failed version stays in state. Changing this setting does not create a new UDF version. */
		failOnBuildError?: c.OptionalInput<boolean>

		/** Input and output format used by the UDF command. */
		format?: c.OptionalInput<string>

		/** Name of the UDF. Unique within the organization. */
		functionName: c.Input<string>

		/** Maximum command execution time in seconds for executable_pool UDFs. */
		maxCommandExecutionTime?: c.OptionalInput<number>

		/** Command pool size for executable_pool UDFs. */
		poolSize?: c.OptionalInput<number>

		/** Name of the returned value, or null when unnamed. */
		returnName?: c.OptionalInput<string>

		/** ClickHouse data type of the returned value. */
		returnType: c.Input<string>

		/** Runtime used to execute the UDF command. */
		runtime: c.Input<string>

		/** Sandbox isolation level. */
		sandboxType?: c.OptionalInput<string>

		/** Whether ClickHouse sends a row-count chunk header. */
		sendChunkHeader?: c.OptionalInput<boolean>

		/** Base64-encoded SHA-256 of the ZIP archive. A change publishes a new UDF version. */
		sourceArchiveHash: c.Input<string>

		/** Local path to the ZIP archive uploaded by the provider. */
		sourceArchivePath: c.Input<string>

		/** Executable UDF type. */
		type: c.Input<string>
	}

	export type UdfOutput = Readonly<{

		/** Arguments passed to the UDF command. */
		arguments: c.Output<ReadonlyArray<Readonly<{

			/** Name of the argument. Required for Native and JSONEachRow formats. */
			name: string

			/** ClickHouse data type of the argument. */
			type: string
		}>>>

		/** Command stdout read timeout in milliseconds. */
		commandReadTimeout: c.Output<number>

		/** Command stdin write timeout in milliseconds. */
		commandWriteTimeout: c.Output<number>

		/** Creation timestamp. */
		createdAt: c.Output<string>

		/** Build error, or null when no build error is present. */
		error: c.Output<string>

		/** When true (the default), a failed build fails the apply. The failed version stays in state. Changing this setting does not create a new UDF version. */
		failOnBuildError: c.Output<boolean>

		/** Input and output format used by the UDF command. */
		format: c.Output<string>

		/** Name of the UDF. Unique within the organization. */
		functionName: c.Output<string>

		/** Maximum command execution time in seconds for executable_pool UDFs. */
		maxCommandExecutionTime: c.Output<number>

		/** Command pool size for executable_pool UDFs. */
		poolSize: c.Output<number>

		/** Name of the returned value, or null when unnamed. */
		returnName: c.Output<string>

		/** ClickHouse data type of the returned value. */
		returnType: c.Output<string>

		/** Runtime used to execute the UDF command. */
		runtime: c.Output<string>

		/** Sandbox isolation level. */
		sandboxType: c.Output<string>

		/** Whether ClickHouse sends a row-count chunk header. */
		sendChunkHeader: c.Output<boolean>

		/** Base64-encoded SHA-256 of the ZIP archive. A change publishes a new UDF version. */
		sourceArchiveHash: c.Output<string>

		/** Local path to the ZIP archive uploaded by the provider. */
		sourceArchivePath: c.Output<string>

		/** Build state of this UDF version. */
		status: c.Output<string>

		/** Executable UDF type. */
		type: c.Output<string>

		/** Last-update timestamp. */
		updatedAt: c.Output<string>

		/** Version number of the UDF. */
		version: c.Output<number>
	}>

	export class Udf {

		constructor(parent: c.Group, id: string, props: UdfInput, config?:c.ResourceConfig)

			readonly [c.nodeMetaSymbol]: c.ResourceMeta

			readonly urn: c.URN


		/** Arguments passed to the UDF command. */
		readonly arguments: c.Output<ReadonlyArray<Readonly<{

			/** Name of the argument. Required for Native and JSONEachRow formats. */
			name: string

			/** ClickHouse data type of the argument. */
			type: string
		}>>>

		/** Command stdout read timeout in milliseconds. */
		readonly commandReadTimeout: c.Output<number>

		/** Command stdin write timeout in milliseconds. */
		readonly commandWriteTimeout: c.Output<number>

		/** Creation timestamp. */
		readonly createdAt: c.Output<string>

		/** Build error, or null when no build error is present. */
		readonly error: c.Output<string>

		/** When true (the default), a failed build fails the apply. The failed version stays in state. Changing this setting does not create a new UDF version. */
		readonly failOnBuildError: c.Output<boolean>

		/** Input and output format used by the UDF command. */
		readonly format: c.Output<string>

		/** Name of the UDF. Unique within the organization. */
		readonly functionName: c.Output<string>

		/** Maximum command execution time in seconds for executable_pool UDFs. */
		readonly maxCommandExecutionTime: c.Output<number>

		/** Command pool size for executable_pool UDFs. */
		readonly poolSize: c.Output<number>

		/** Name of the returned value, or null when unnamed. */
		readonly returnName: c.Output<string>

		/** ClickHouse data type of the returned value. */
		readonly returnType: c.Output<string>

		/** Runtime used to execute the UDF command. */
		readonly runtime: c.Output<string>

		/** Sandbox isolation level. */
		readonly sandboxType: c.Output<string>

		/** Whether ClickHouse sends a row-count chunk header. */
		readonly sendChunkHeader: c.Output<boolean>

		/** Base64-encoded SHA-256 of the ZIP archive. A change publishes a new UDF version. */
		readonly sourceArchiveHash: c.Output<string>

		/** Local path to the ZIP archive uploaded by the provider. */
		readonly sourceArchivePath: c.Output<string>

		/** Build state of this UDF version. */
		readonly status: c.Output<string>

		/** Executable UDF type. */
		readonly type: c.Output<string>

		/** Last-update timestamp. */
		readonly updatedAt: c.Output<string>

		/** Version number of the UDF. */
		readonly version: c.Output<number>

	}
	export namespace udf {
		export type AttachmentInput = {

			/** Name of the UDF. */
			functionName: c.Input<string>

			/** ID of the attached service. */
			serviceId: c.Input<string>

			/** Version to attach. */
			version: c.Input<number>
		}

		export type AttachmentOutput = Readonly<{

			/** Name of the UDF. */
			functionName: c.Output<string>

			/** ID of the attached service. */
			serviceId: c.Output<string>

			/** Current attachment lifecycle state. */
			status: c.Output<string>

			/** Version to attach. */
			version: c.Output<number>
		}>

		export class Attachment {

			constructor(parent: c.Group, id: string, props: AttachmentInput, config?:c.ResourceConfig)

				readonly [c.nodeMetaSymbol]: c.ResourceMeta

				readonly urn: c.URN


			/** Name of the UDF. */
			readonly functionName: c.Output<string>

			/** ID of the attached service. */
			readonly serviceId: c.Output<string>

			/** Current attachment lifecycle state. */
			readonly status: c.Output<string>

			/** Version to attach. */
			readonly version: c.Output<number>

		}
	}
}

export declare namespace clickhouse {
	export namespace api {
		export type GetKeyIdInput = {

			/** The name of the API key to retrieve information about. If left empty, the API key used by the Terraform provider is used instead. */
			name?: c.OptionalInput<string>
		}

		export type GetKeyIdOutput = Readonly<{

			/** The ID of the API key used by the provider to connect to the service. This is a read-only attribute. */
			id: c.Output<string>

			/** The name of the API key to retrieve information about. If left empty, the API key used by the Terraform provider is used instead. */
			name: c.Output<string>
		}>

		export const getKeyId:c.DataSourceFunction<GetKeyIdInput, GetKeyIdOutput>
	}
	export namespace byoc {
		export type GetInfrastructureInput = {

			/** ID of the BYOC infrastructure. */
			id: c.Input<string>
		}

		export type GetInfrastructureOutput = Readonly<{

			/** Customer cloud account the infrastructure is deployed into: AWS account ID, GCP project ID or Azure subscription ID. */
			accountId: c.Output<string>

			/** ID of the customer-managed VPC. Null unless 'is_byo_vpc' is true. */
			byoVpcId: c.Output<string>

			/** GCP only: names of the secondary ranges used for pod IPs in the customer-managed VPC. */
			byoVpcPodCidrRangeNames: c.Output<ReadonlyArray<string>>

			/** Private subnet IDs of the customer-managed VPC. Empty unless 'is_byo_vpc' is true. */
			byoVpcPrivateSubnetIds: c.Output<ReadonlyArray<string>>

			/** GCP only: host project of the shared VPC, when the customer-managed VPC is a shared VPC. */
			byoVpcSharedVpcHostProjectId: c.Output<string>

			/** Cloud provider the infrastructure runs in ('aws', 'gcp' or 'azure'). */
			cloudProvider: c.Output<string>

			/** Human readable name of the infrastructure. */
			displayName: c.Output<string>

			/** Whether private link connectivity (AWS PrivateLink, GCP Private Service Connect or Azure Private Link) is enabled. */
			enablePrivateLink: c.Output<boolean>

			/** Whether the internal (VPC-private) load balancer is enabled. */
			enablePrivateLoadBalancer: c.Output<boolean>

			/** Whether the internet-facing load balancer is enabled. */
			enablePublicLoadBalancer: c.Output<boolean>

			/** GCP only: subnet used for the Private Service Connect NAT. Null unless private link is enabled on a GCP infrastructure. */
			gcpPscSubnetId: c.Output<string>

			/** ID of the BYOC infrastructure. */
			id: c.Output<string>

			/** Whether the infrastructure runs inside a customer-managed VPC instead of a ClickHouse-managed one. */
			isByoVpc: c.Output<boolean>
			privateEndpointConfig: c.Output<Readonly<{

				/** Name of the endpoint service: AWS VPC endpoint service name, GCP Private Service Connect service attachment or Azure Private Link service alias. */
				endpointName: string

				/** Private DNS hostname of the VPC the infrastructure runs in. */
				privateDnsHostname: string
			}>>

			/** Region the infrastructure is deployed in (e.g. 'us-east-1'). */
			regionId: c.Output<string>

			/** Provisioning state of the infrastructure (e.g. 'infra-provisioning', 'infra-ready', 'infra-terminating'). */
			state: c.Output<string>

			/** Tags applied to the cloud resources of the infrastructure. */
			tags: c.Output<Readonly<_Record<string>>>

			/** Availability zones the infrastructure VPC spans. */
			vpcAvailabilityZoneList: c.Output<ReadonlyArray<string>>

			/** CIDR range of the infrastructure VPC. Null for BYO-VPC infrastructures. */
			vpcCidrRange: c.Output<string>
		}>

		export const getInfrastructure:c.DataSourceFunction<GetInfrastructureInput, GetInfrastructureOutput>
		export type GetInfrastructuresInput = {

		}

		export type GetInfrastructuresOutput = Readonly<{

			/** All BYOC infrastructures of the organization. */
			infrastructures: c.Output<ReadonlyArray<Readonly<{

				/** Customer cloud account the infrastructure is deployed into: AWS account ID, GCP project ID or Azure subscription ID. */
				accountId: string

				/** Cloud provider the infrastructure runs in ('aws', 'gcp' or 'azure'). */
				cloudProvider: string

				/** Human readable name of the infrastructure. */
				displayName: string

				/** Unique ID of the BYOC infrastructure. */
				id: string

				/** Region the infrastructure is deployed in (e.g. 'us-east-1'). */
				regionId: string

				/** Provisioning state of the infrastructure (e.g. 'infra-provisioning', 'infra-ready', 'infra-terminating'). */
				state: string
			}>>>
		}>

		export const getInfrastructures:c.DataSourceFunction<GetInfrastructuresInput, GetInfrastructuresOutput>
	}
	export namespace clickpipes {
		export type GetServiceContextInput = {

			/** Maximum duration to wait for GCP workload identity readiness. Defaults to 30s. Uses Go duration syntax, for example 2m or 1m30s. */
			readyTimeout?: c.OptionalInput<string>

			/** ClickHouse Cloud service ID whose ClickPipes context should be retrieved. */
			serviceId: c.Input<string>

			/** Wait until GCP workload identity is ready and has a principal. Defaults to true. */
			waitForIdentity?: c.OptionalInput<boolean>
		}

		export type GetServiceContextOutput = Readonly<{
			gcpWorkloadIdentity: c.Output<Readonly<{

				/** GCP service account to grant access to source resources. */
				principal: string

				/** Whether the service tenant identity is ready. */
				ready: boolean

				/** Whether the ClickPipes deployment supports GCP workload identity. */
				supported: boolean
			}>>

			/** Maximum duration to wait for GCP workload identity readiness. Defaults to 30s. Uses Go duration syntax, for example 2m or 1m30s. */
			readyTimeout: c.Output<string>

			/** ClickHouse Cloud service ID whose ClickPipes context should be retrieved. */
			serviceId: c.Output<string>

			/** Wait until GCP workload identity is ready and has a principal. Defaults to true. */
			waitForIdentity: c.Output<boolean>
		}>

		export const getServiceContext:c.DataSourceFunction<GetServiceContextInput, GetServiceContextOutput>
	}
	export namespace clickstack {
		export type GetDashboardInput = {

			/** Identifier of the dashboard to fetch. */
			id: c.Input<string>

			/** Team ID to look the dashboard up under, sent as the `x-hdx-team` header. Defaults to the API key's team. */
			team?: c.OptionalInput<string>
		}

		export type GetDashboardOutput = Readonly<{

			/** The server-canonical dashboard body as a JSON string, in the v2 API format. Note this is the body the API returns (with server-assigned ids/timestamps), equivalent to a resource's `normalized_json` — not the authored source-of-truth `dashboard_json` of the `clickstack_dashboard` resource. Feeding it directly into a resource's `dashboard_json` passes server-canonical content, including ids and timestamps. */
			dashboardJson: c.Output<string>

			/** Identifier of the dashboard to fetch. */
			id: c.Output<string>

			/** Team ID to look the dashboard up under, sent as the `x-hdx-team` header. Defaults to the API key's team. */
			team: c.OptionalOutput<string>
		}>

		export const getDashboard:c.DataSourceFunction<GetDashboardInput, GetDashboardOutput>
		export type GetRoleInput = {

			/** Name of the role to look up. */
			name: c.Input<string>

			/** Team ID to look the role up under, sent as the `x-hdx-team` header. Defaults to the API key's team. */
			team?: c.OptionalInput<string>
		}

		export type GetRoleOutput = Readonly<{

			/** Human-readable description of the role. */
			description: c.Output<string>

			/** Identifier of the role. */
			id: c.Output<string>

			/** Whether the role is a predefined (built-in) role. */
			isPredefined: c.Output<boolean>

			/** Name of the role to look up. */
			name: c.Output<string>

			/** Team ID to look the role up under, sent as the `x-hdx-team` header. Defaults to the API key's team. */
			team: c.OptionalOutput<string>
		}>

		export const getRole:c.DataSourceFunction<GetRoleInput, GetRoleOutput>
	}
	export namespace postgres {
		export type GetServiceInput = {

			/** Unique identifier of the Postgres service to look up. */
			id: c.Input<string>
		}

		export type GetServiceOutput = Readonly<{

			/** Cloud provider hosting the instance. */
			cloudProvider: c.Output<string>

			/** RFC3339 creation timestamp. */
			createdAt: c.Output<string>

			/** High-availability mode ('none', 'async', 'sync'). */
			haType: c.Output<string>

			/** Network hostname for client connections. */
			hostname: c.Output<string>

			/** Unique identifier of the Postgres service to look up. */
			id: c.Output<string>

			/** IPv4 TCP access list. IPv6 rules are not included. */
			ipAccess: c.Output<ReadonlyArray<Readonly<{

				/** Description of the IP address. */
				description: string

				/** TCP port or inclusive port range. */
				portRange: string

				/** IPv4 address or CIDR allowed to connect. */
				source: string
			}>>>

			/** True for a primary; false for a read replica. */
			isPrimary: c.Output<boolean>

			/** Human-readable name. */
			name: c.Output<string>

			/** Postgres server parameters currently set on the instance. Read-only; a string map. */
			pgConfig: c.Output<Readonly<_Record<string>>>

			/** PgBouncer parameters currently set on the instance. Read-only; a string map. */
			pgbouncerConfig: c.Output<Readonly<_Record<string>>>

			/** TCP port for client connections. */
			port: c.Output<number>

			/** Major Postgres version. */
			postgresVersion: c.Output<string>

			/** Cloud region. */
			region: c.Output<string>

			/** Instance size (VM SKU). */
			size: c.Output<string>

			/** Server-reported state. */
			state: c.Output<string>

			/** User tags. Read-only; a string map. */
			tags: c.Output<Readonly<_Record<string>>>

			/** Default superuser name. */
			username: c.Output<string>
		}>

		export const getService:c.DataSourceFunction<GetServiceInput, GetServiceOutput>
		export type GetServiceCaCertificatesInput = {

			/** ID of the Postgres service whose CA certificate chain to fetch. */
			serviceId: c.Input<string>
		}

		export type GetServiceCaCertificatesOutput = Readonly<{

			/** PEM-encoded CA certificate chain. */
			certificate: c.Output<string>

			/** ID of the Postgres service whose CA certificate chain to fetch. */
			serviceId: c.Output<string>
		}>

		export const getServiceCaCertificates:c.DataSourceFunction<GetServiceCaCertificatesInput, GetServiceCaCertificatesOutput>
		export type GetServicesInput = {

		}

		export type GetServicesOutput = Readonly<{

			/** All Managed Postgres services in the organization (summary fields). */
			services: c.Output<ReadonlyArray<Readonly<{
				cloudProvider: string
				createdAt: string
				haType: string
				id: string
				isPrimary: boolean
				name: string
				postgresVersion: string
				region: string
				size: string
				state: string
			}>>>
		}>

		export const getServices:c.DataSourceFunction<GetServicesInput, GetServicesOutput>
	}
	export namespace private {
		export type GetEndpointConfigInput = {

			/** The cloud provider for the private endpoint. Valid values are 'aws', 'gcp', or 'azure'. */
			cloudProvider: c.Input<string>

			/** The region for the private endpoint. Valid values are specific to the cloud provider i.e. us-east-2 */
			region: c.Input<string>
		}

		export type GetEndpointConfigOutput = Readonly<{

			/** The cloud provider for the private endpoint. Valid values are 'aws', 'gcp', or 'azure'. */
			cloudProvider: c.Output<string>

			/** The ID of the private endpoint that is used to securely connect to ClickHouse. This is a read-only attribute. */
			endpointServiceId: c.Output<string>

			/** The region for the private endpoint. Valid values are specific to the cloud provider i.e. us-east-2 */
			region: c.Output<string>
		}>

		export const getEndpointConfig:c.DataSourceFunction<GetEndpointConfigInput, GetEndpointConfigOutput>
	}
	export type GetRoleInput = {

		/** Unique identifier of the role. Exactly one of id or name must be set. */
		id?: c.OptionalInput<string>

		/** Name of the role to look up. Exactly one of id or name must be set. */
		name?: c.OptionalInput<string>
	}

	export type GetRoleOutput = Readonly<{

		/** List of actors assigned to this role. */
		actors: c.Output<ReadonlyArray<string>>

		/** Timestamp when the role was created. */
		createdAt: c.Output<string>

		/** Unique identifier of the role. Exactly one of id or name must be set. */
		id: c.Output<string>

		/** Name of the role to look up. Exactly one of id or name must be set. */
		name: c.Output<string>

		/** Owner ID of this role. */
		ownerId: c.Output<string>

		/** List of policies attached to this role. */
		policies: c.Output<ReadonlyArray<Readonly<{

			/** Whether this policy allows or denies the specified permissions. */
			effect: string

			/** Server-assigned policy ID. */
			id: string

			/** List of permission strings. */
			permissions: ReadonlyArray<string>

			/** List of resources this policy applies to. */
			resources: ReadonlyArray<string>

			/** ID of the role this policy belongs to. */
			roleId: string
			tags: Readonly<{

				/** Ordered SQL GRANT and REVOKE statements for custom SQL console access. */
				grants: ReadonlyArray<string>

				/** SQL console role level for passwordless DB access. One of: sql-console-admin (full access), sql-console-readonly (read-only). */
				role: string
			}>

			/** Tenant ID that owns this policy. */
			tenantId: string
		}>>>

		/** Tenant ID that owns this role. */
		tenantId: c.Output<string>

		/** Type of the role: 'system' or 'custom'. */
		type: c.Output<string>

		/** Timestamp when the role was last updated. */
		updatedAt: c.Output<string>
	}>

	export const getRole:c.DataSourceFunction<GetRoleInput, GetRoleOutput>
	export type GetRolesInput = {

	}

	export type GetRolesOutput = Readonly<{

		/** List of all roles in the organization. */
		roles: c.Output<ReadonlyArray<Readonly<{

			/** List of actors assigned to this role. */
			actors: ReadonlyArray<string>

			/** Timestamp when the role was created. */
			createdAt: string

			/** Unique identifier for the role. */
			id: string

			/** Name of the role. */
			name: string

			/** Owner ID of this role. */
			ownerId: string

			/** List of policies attached to this role. */
			policies: ReadonlyArray<Readonly<{

				/** Whether this policy allows or denies the specified permissions. */
				effect: string

				/** Server-assigned policy ID. */
				id: string

				/** List of permission strings. */
				permissions: ReadonlyArray<string>

				/** List of resources this policy applies to. */
				resources: ReadonlyArray<string>

				/** ID of the role this policy belongs to. */
				roleId: string
				tags: Readonly<{

					/** Ordered SQL GRANT and REVOKE statements for custom SQL console access. */
					grants: ReadonlyArray<string>

					/** SQL console role level for passwordless DB access. One of: sql-console-admin (full access), sql-console-readonly (read-only). */
					role: string
				}>

				/** Tenant ID that owns this policy. */
				tenantId: string
			}>>

			/** Tenant ID that owns this role. */
			tenantId: string

			/** Type of the role: 'system' or 'custom'. */
			type: string

			/** Timestamp when the role was last updated. */
			updatedAt: string
		}>>>
	}>

	export const getRoles:c.DataSourceFunction<GetRolesInput, GetRolesOutput>
	export type GetServiceInput = {

		/** Unique identifier of the service to look up. */
		id: c.Input<string>
	}

	export type GetServiceOutput = Readonly<{

		/** Autoscaling mode ('vertical' or 'horizontal'). */
		autoscalingMode: c.Output<string>

		/** Identifier of the BYOC (Bring Your Own Cloud) infrastructure hosting the service, if any. */
		byocId: c.Output<string>

		/** ClickHouse version running on the service. */
		clickhouseVersion: c.Output<string>

		/** Cloud provider hosting the service ('aws', 'gcp', or 'azure'). */
		cloudProvider: c.Output<string>

		/** Compliance regime the service was created under, if any (e.g. 'hipaa', 'pci'). */
		complianceType: c.Output<string>

		/** RFC3339 creation timestamp. */
		createdAt: c.Output<string>

		/** Whether core dumps are enabled for debugging. */
		enableCoreDumps: c.Output<boolean>

		/** IAM role assumed to use the customer-managed encryption key, if any. */
		encryptionAssumedRoleIdentifier: c.Output<string>

		/** Customer-managed encryption key (CMK) protecting the service, if any. */
		encryptionKey: c.Output<string>

		/** Role ID used for encryption, if any. */
		encryptionRoleId: c.Output<string>

		/** Network endpoints exposed by the service. */
		endpoints: c.Output<ReadonlyArray<Readonly<{

			/** Endpoint host. */
			host: string

			/** Endpoint port. */
			port: number

			/** Endpoint protocol (e.g. 'nativesecure', 'https', 'mysql'). */
			protocol: string
		}>>>

		/** Whether Transparent Data Encryption (TDE) is enabled. */
		hasTransparentDataEncryption: c.Output<boolean>

		/** AWS IAM role the service assumes to access external resources. */
		iamRole: c.Output<string>

		/** Unique identifier of the service to look up. */
		id: c.Output<string>

		/** Whether the service scales down when idle. */
		idleScaling: c.Output<boolean>

		/** Minutes of inactivity before the service idles. */
		idleTimeoutMinutes: c.Output<number>

		/** IP allow-list entries permitted to connect to the service. */
		ipAccess: c.Output<ReadonlyArray<Readonly<{

			/** Description of the allow-list entry. */
			description: string

			/** CIDR or IP address allowed to connect. */
			source: string
		}>>>

		/** True for a primary service; false for a read replica. */
		isPrimary: c.Output<boolean>

		/** Maximum memory per replica, in GB. */
		maxReplicaMemoryGb: c.Output<number>

		/** Maximum number of replicas (horizontal autoscaling). */
		maxReplicas: c.Output<number>

		/** Maximum total memory across all replicas, in GB. */
		maxTotalMemoryGb: c.Output<number>

		/** Minimum memory per replica, in GB. */
		minReplicaMemoryGb: c.Output<number>

		/** Minimum number of replicas (horizontal autoscaling). */
		minReplicas: c.Output<number>

		/** Minimum total memory across all replicas, in GB. */
		minTotalMemoryGb: c.Output<number>

		/** Human-readable name of the service. */
		name: c.Output<string>

		/** Number of replicas. */
		numReplicas: c.Output<number>

		/** IDs of private endpoints attached to the service. */
		privateEndpointIds: c.Output<ReadonlyArray<string>>

		/** Custom instance profile of the service, if any (e.g. a dynamic BYOC profile such as 'v1-standard-byoc-4'). */
		profile: c.Output<string>

		/** Whether the service is read-only. */
		readonly: c.Output<boolean>

		/** Cloud region the service runs in. */
		region: c.Output<string>

		/** Release channel ('default' or 'fast'). */
		releaseChannel: c.Output<string>

		/** Current service state (e.g. 'running', 'idle', 'stopped'). */
		state: c.Output<string>

		/** User-defined key/value tags on the service. */
		tags: c.Output<Readonly<_Record<string>>>

		/** Service tier. */
		tier: c.Output<string>

		/** Key ID used for Transparent Data Encryption, if enabled. */
		transparentDataEncryptionKeyId: c.Output<string>

		/** Identifier of the data warehouse this service belongs to, if any. */
		warehouseId: c.Output<string>
	}>

	export const getService:c.DataSourceFunction<GetServiceInput, GetServiceOutput>
	export namespace service {
		export type GetProfilesInput = {

			/** BYOC infrastructure ID. Required to include dynamic BYOC profiles in the result. When set, 'region_id' can be omitted and the BYOC infrastructure's region is used. */
			byocId?: c.OptionalInput<string>

			/** Region to list available profiles for (e.g. 'us-east-1'). Required unless 'byoc_id' is set; when both are set it must match the BYOC infrastructure's region. */
			regionId?: c.OptionalInput<string>
		}

		export type GetProfilesOutput = Readonly<{

			/** BYOC infrastructure ID. Required to include dynamic BYOC profiles in the result. When set, 'region_id' can be omitted and the BYOC infrastructure's region is used. */
			byocId: c.OptionalOutput<string>

			/** Custom instance profiles available to the organization in the given region. */
			profiles: c.Output<ReadonlyArray<Readonly<{

				/** Number of CPU cores per replica. */
				cpuCores: number

				/** Memory per replica in GiB. For BYOC profiles, 'min_replica_memory_gb' and 'max_replica_memory_gb' on the service must both equal this value. */
				memoryGi: number

				/** Profile name, usable as the 'profile' attribute of the clickhouse_service resource. */
				profile: string
			}>>>

			/** Region to list available profiles for (e.g. 'us-east-1'). Required unless 'byoc_id' is set; when both are set it must match the BYOC infrastructure's region. */
			regionId: c.OptionalOutput<string>
		}>

		export const getProfiles:c.DataSourceFunction<GetProfilesInput, GetProfilesOutput>
	}
	export type GetServicesInput = {

		/** Optional tag filter. Each key/value becomes an API filter `tag:Key=Value`. Only services matching all tags are returned. */
		tags?: c.OptionalInput<_Record<c.Input<string>>>
	}

	export type GetServicesOutput = Readonly<{

		/** All services in the organization (optionally tag-filtered). */
		services: c.Output<ReadonlyArray<Readonly<{

			/** Autoscaling mode ('vertical' or 'horizontal'). */
			autoscalingMode: string

			/** Identifier of the BYOC (Bring Your Own Cloud) infrastructure hosting the service, if any. */
			byocId: string

			/** ClickHouse version running on the service. */
			clickhouseVersion: string

			/** Cloud provider hosting the service ('aws', 'gcp', or 'azure'). */
			cloudProvider: string

			/** Compliance regime the service was created under, if any (e.g. 'hipaa', 'pci'). */
			complianceType: string

			/** RFC3339 creation timestamp. */
			createdAt: string

			/** Whether core dumps are enabled for debugging. */
			enableCoreDumps: boolean

			/** IAM role assumed to use the customer-managed encryption key, if any. */
			encryptionAssumedRoleIdentifier: string

			/** Customer-managed encryption key (CMK) protecting the service, if any. */
			encryptionKey: string

			/** Role ID used for encryption, if any. */
			encryptionRoleId: string

			/** Network endpoints exposed by the service. */
			endpoints: ReadonlyArray<Readonly<{

				/** Endpoint host. */
				host: string

				/** Endpoint port. */
				port: number

				/** Endpoint protocol (e.g. 'nativesecure', 'https', 'mysql'). */
				protocol: string
			}>>

			/** Whether Transparent Data Encryption (TDE) is enabled. */
			hasTransparentDataEncryption: boolean

			/** AWS IAM role the service assumes to access external resources. */
			iamRole: string

			/** Unique identifier of the service. */
			id: string

			/** Whether the service scales down when idle. */
			idleScaling: boolean

			/** Minutes of inactivity before the service idles. */
			idleTimeoutMinutes: number

			/** IP allow-list entries permitted to connect to the service. */
			ipAccess: ReadonlyArray<Readonly<{

				/** Description of the allow-list entry. */
				description: string

				/** CIDR or IP address allowed to connect. */
				source: string
			}>>

			/** True for a primary service; false for a read replica. */
			isPrimary: boolean

			/** Maximum memory per replica, in GB. */
			maxReplicaMemoryGb: number

			/** Maximum number of replicas (horizontal autoscaling). */
			maxReplicas: number

			/** Maximum total memory across all replicas, in GB. */
			maxTotalMemoryGb: number

			/** Minimum memory per replica, in GB. */
			minReplicaMemoryGb: number

			/** Minimum number of replicas (horizontal autoscaling). */
			minReplicas: number

			/** Minimum total memory across all replicas, in GB. */
			minTotalMemoryGb: number

			/** Human-readable name of the service. */
			name: string

			/** Number of replicas. */
			numReplicas: number

			/** IDs of private endpoints attached to the service. */
			privateEndpointIds: ReadonlyArray<string>

			/** Custom instance profile of the service, if any (e.g. a dynamic BYOC profile such as 'v1-standard-byoc-4'). */
			profile: string

			/** Whether the service is read-only. */
			readonly: boolean

			/** Cloud region the service runs in. */
			region: string

			/** Release channel ('default' or 'fast'). */
			releaseChannel: string

			/** Current service state (e.g. 'running', 'idle', 'stopped'). */
			state: string

			/** User-defined key/value tags on the service. */
			tags: Readonly<_Record<string>>

			/** Service tier. */
			tier: string

			/** Key ID used for Transparent Data Encryption, if enabled. */
			transparentDataEncryptionKeyId: string

			/** Identifier of the data warehouse this service belongs to, if any. */
			warehouseId: string
		}>>>

		/** Optional tag filter. Each key/value becomes an API filter `tag:Key=Value`. Only services matching all tags are returned. */
		tags: c.OptionalOutput<Readonly<_Record<string>>>
	}>

	export const getServices:c.DataSourceFunction<GetServicesInput, GetServicesOutput>
	export type GetUserInput = {

		/** Email address of the user. Exactly one of id or email must be set. */
		email?: c.OptionalInput<string>

		/** User ID. Exactly one of id or email must be set. */
		id?: c.OptionalInput<string>
	}

	export type GetUserOutput = Readonly<{

		/** Roles assigned to the user. */
		assignedRoles: c.Output<ReadonlyArray<Readonly<{

			/** The ID of the assigned role. */
			id: string

			/** The name of the assigned role. */
			name: string

			/** The type of the assigned role (system or custom). */
			type: string
		}>>>

		/** Email address of the user. Exactly one of id or email must be set. */
		email: c.Output<string>

		/** User ID. Exactly one of id or email must be set. */
		id: c.Output<string>

		/** Timestamp when the user joined the organization. */
		joinedAt: c.Output<string>

		/** Display name of the user. */
		name: c.Output<string>
	}>

	export const getUser:c.DataSourceFunction<GetUserInput, GetUserOutput>
}