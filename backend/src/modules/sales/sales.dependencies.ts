import { pool } from "../../database/index.ts";
import { PostgresSalesRepository } from "./postgres-sales.repository";
import { SalesController } from "./sales.controller";
import { SalesService } from "./sales.service";

const repository = new PostgresSalesRepository(pool);

const service = new SalesService(repository);

export const salesController = new SalesController(service);
