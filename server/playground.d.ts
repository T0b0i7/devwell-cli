import type { IncomingMessage } from "node:http";

type PlaygroundRequest = IncomingMessage & { body?: unknown };
type PlaygroundResponse = { status: number; body: Record<string, unknown> };

export function handlePlaygroundRequest(req: PlaygroundRequest): Promise<PlaygroundResponse>;
