class ApiResponse{
    statusCode = 0;
    data;
    message = "";
    success;
    constructor(statusCode, data, message = "Success"){
        this.statusCode = statusCode
        this.data = data;
        this.message = message
        this.success = statusCode < 400
    }
}

export {ApiResponse}