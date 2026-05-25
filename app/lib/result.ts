// Result<T, E> — Railway-Oriented Programming type.
// Functions return Ok(value) | Err(error) instead of throwing exceptions.
// This makes error paths explicit in the type system and eliminates hidden control flow.
export type Ok<T> = { ok: true; value: T };
export type Err<E = Error> = { ok: false; error: E };
export type Result<T, E = Error> = Ok<T> | Err<E>;

export const Result = {
  ok: <T>(value: T): Ok<T> => ({ ok: true, value }),
  err: <E = Error>(error: E): Err<E> => ({ ok: false, error }),
  isOk: <T, E>(r: Result<T, E>): r is Ok<T> => r.ok,
  isErr: <T, E>(r: Result<T, E>): r is Err<E> => !r.ok,

  map: <T, U, E>(r: Result<T, E>, fn: (v: T) => U): Result<U, E> =>
    r.ok ? Result.ok(fn(r.value)) : r,

  flatMap: <T, U, E>(r: Result<T, E>, fn: (v: T) => Result<U, E>): Result<U, E> =>
    r.ok ? fn(r.value) : r,

  getOrThrow: <T, E extends Error>(r: Result<T, E>): T => {
    if (r.ok) return r.value;
    throw r.error;
  },
};
