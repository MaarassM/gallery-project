import { auth } from "~/lib/auth/config";
import type { ORPCContext } from "./context";

// CHAIN OF RESPONSIBILITY PATTERN: Request prolazi kroz middleware chain.
// Svaki middleware može obraditi request i proslijediti sljedećem: publicProcedure -> authedProcedure -> adminProcedure
// Chain: Parsiraj request -> Provjeri auth -> Provjeri ulogu -> Izvrši handler

// Bazni procedure type
export type Procedure<TInput = any, TOutput = any> = {
  input: (schema: any) => Procedure<TInput, TOutput>;
  handler: (
    fn: (args: { input: TInput; context: ORPCContext }) => Promise<TOutput>
  ) => Procedure<TInput, TOutput>;
  _inputSchema?: any;
  _handler?: (args: { input: TInput; context: ORPCContext }) => Promise<TOutput>;
  use: (middleware: any) => Procedure<TInput, TOutput>;
  _middleware?: any[];
};

function createProcedure(): Procedure {
  const proc: Procedure = {
    _middleware: [],
    input(schema: any) {
      this._inputSchema = schema;
      return this;
    },
    handler(fn: any) {
      this._handler = fn;
      return this;
    },
    use(middleware: any) {
      this._middleware = [...(this._middleware || []), middleware];
      return this;
    },
  };
  return proc;
}

// Bazna procedura
export const baseProcedure = createProcedure();

// Javna procedura (autentifikacija nije potrebna)
export const publicProcedure = createProcedure();

// Autentificirana procedura (zahtijeva valjanu sesiju)
export const authedProcedure = createProcedure().use(
  async ({ context }: { context: ORPCContext }) => {
    const session = await auth.api.getSession({ headers: context.headers });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    return {
      context: {
        ...context,
        user: session.user,
      },
    };
  }
);

// Admin procedura (zahtijeva admin ulogu)
export const adminProcedure = authedProcedure.use(
  async ({ context }: { context: ORPCContext & { user: any } }) => {
    if (context.user?.role !== "ADMINISTRATOR") {
      throw new Error("Forbidden - Admin access required");
    }

    return { context };
  }
);
