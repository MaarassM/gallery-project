# Design Patterns

## 1. Strategy Pattern

**Location:** [app/modules/images/strategies/](app/modules/images/strategies/)

- [storage-strategy.interface.ts](app/modules/images/strategies/storage-strategy.interface.ts) - interface
- [local-storage-strategy.ts](app/modules/images/strategies/local-storage-strategy.ts) - local implementation
- [cloud-storage-strategy.ts](app/modules/images/strategies/cloud-storage-strategy.ts) - cloud implementation (placeholder)

Omogućuje zamjenu storage backenda (local/cloud) bez mijenjanja poslovne logike.

## 2. Factory Pattern

**Location:** [processor-factory.ts](app/modules/images/factories/processor-factory.ts)

Stvara odgovarajuće processore na temelju tipa obrade.

## 3. Builder Pattern

**Location:** [pipeline-builder.ts](app/modules/images/pipelines/pipeline-builder.ts)

Fluent API za izgradnju image processing pipelinea s opcionalnim koracima (resize, filter, format).

## 4. Repository Pattern

**Location:** [photo-repository.ts](app/modules/photos/repositories/photo-repository.ts)

Enkapsulira sve operacije nad bazom podataka za fotografije.

## 5. Singleton Pattern

**Location:** [client.ts](app/lib/db/client.ts)

Osigurava jednu instancu Prisma clienta kroz cijelu aplikaciju.

## 6. Decorator Pattern

**Location:** [audit-service.ts](app/modules/audit/services/audit-service.ts)

AuditService "dekorira" operacije s loggingom bez mijenjanja poslovne logike.

## 7. Observer Pattern

**Location:** [PhotoUploader.tsx](app/modules/photos/components/PhotoUploader.tsx) - TanStack Form

## 8. Chain of Responsibility

**Location:** [middleware.ts](app/lib/orpc/middleware.ts)

Middleware chain obrađuje requestove sekvencijalno (auth → validation → handler).
