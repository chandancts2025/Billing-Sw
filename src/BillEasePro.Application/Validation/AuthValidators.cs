using BillEasePro.Application.Dtos;
using FluentValidation;

namespace BillEasePro.Application.Validation;

public sealed class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(160);
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Address).NotNull();
        RuleFor(x => x.Address.Line1).NotEmpty().MaximumLength(220);
        RuleFor(x => x.Address.City).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Address.State).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Address.Pincode).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8)
            .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
            .Matches("[0-9]").WithMessage("Password must contain at least one number.")
            .Matches("[^a-zA-Z0-9]").WithMessage("Password must contain at least one symbol.");
        RuleFor(x => x.ConfirmPassword).Equal(x => x.Password);
    }
}

public sealed class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public sealed class CreateSaleInvoiceRequestValidator : AbstractValidator<CreateSaleInvoiceRequest>
{
    public CreateSaleInvoiceRequestValidator()
    {
        RuleFor(x => x.ShopId).NotEmpty();
        RuleFor(x => x.Items).NotEmpty();
        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(x => x.ProductId).NotEmpty();
            item.RuleFor(x => x.Quantity).GreaterThan(0);
            item.RuleFor(x => x.UnitPrice).GreaterThanOrEqualTo(0);
            item.RuleFor(x => x.TaxRate).InclusiveBetween(0, 100);
        });
    }
}

public sealed class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(x => x.CurrentPassword).NotEmpty();
        RuleFor(x => x.NewPassword)
            .NotEmpty()
            .MinimumLength(8)
            .Matches("[A-Z]")
            .Matches("[0-9]")
            .Matches("[^a-zA-Z0-9]")
            .NotEqual(x => x.CurrentPassword);
    }
}
