class Account {
    private String accNumber;
    private double amount;

    public Account(String accNumber, double amount) {
        this.accNumber = accNumber;
        this.amount = amount;
    }

    public double getBalance() {
        return amount;
    }

    public void setBalance(double value) {
        if (value >= 0)
            amount = value;
    }

    public void deposit(double value) {
        amount = amount + value;
    }

    public void withdraw(double value) {
        if (value <= amount) {
            amount -= value;
            System.out.println("Withdrawal successful");
        } else {
            System.out.println("Insufficient funds");
        }
    }
}

public class Main {
    public static void main(String[] args) {
        Account account = new Account("122365478", 1000);

        account.deposit(100.50);
        account.withdraw(200.80);
        account.withdraw(900);

        System.out.println(account.getBalance());
    }
}