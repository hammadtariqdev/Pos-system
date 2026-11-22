import type {Response} from "express";

interface ApiResponseOptions<T>{
    message : string;
    data: T;
    statusCode?: number;

}

export function sendSuccess<T>(
    res: Response,
    {
        message,
        data,
        statusCode = 200
    }: ApiResponseOptions<T>
) {
    return res.status(statusCode).json({
        status: "success",
        message,
        data
    })
}