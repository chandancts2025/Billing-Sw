namespace BillEasePro.Application.Common;

public sealed record Result<T>(bool Succeeded, T? Data, string[] Errors)
{
    public static Result<T> Success(T data) => new(true, data, Array.Empty<string>());
    public static Result<T> Failure(params string[] errors) => new(false, default, errors);
}

public sealed record ApiMessage(string Message);
