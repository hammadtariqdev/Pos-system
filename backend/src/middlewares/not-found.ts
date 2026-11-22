import type { RequestHandler } from 'express';

import AppError from '../utils/app-error';

const notFound: RequestHandler = (req, _res, next) => {
    next(
        new AppError(
            `Can't find ${req.method} on ${req.originalUrl} this server!`,
            404
        )
    )
}

export default notFound;