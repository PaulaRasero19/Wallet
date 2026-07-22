import type { HydratedDocument } from "mongoose";

type AnyDocument = HydratedDocument<Record<string, unknown>> | Record<string, unknown>;

function plain(doc: AnyDocument) {
  if ("toObject" in doc && typeof doc.toObject === "function") {
    return doc.toObject();
  }

  return { ...doc };
}

export function serializeDocument(doc: AnyDocument) {
  const object = plain(doc);
  const idSource = object._id;

  return {
    ...object,
    id: idSource && typeof idSource === "object" && "toString" in idSource ? idSource.toString() : object.id,
    _id: undefined,
    __v: undefined
  };
}

export function serializeList<T extends AnyDocument>(docs: T[]) {
  return docs.map((doc) => serializeDocument(doc));
}
