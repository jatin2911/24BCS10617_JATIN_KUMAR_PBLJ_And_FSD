class Account {
    private String accNo;
    private double money;

    Account(String accNo, double money) {
        this.accNo = accNo;
        this.money = money;
    }

    public double getBalance() {
        return money;
    }

    public void setBalance(double money) {
        if (money >= 0)
            this.money = money;
    }

    public void deposit(double value) {
        money = money + value;
    }

    public void withdraw(double value) {
        if (value <= money) {
            money -= value;
            System.out.println("Withdrawal successful");
        } else {
            System.out.println("Insufficient funds");
        }
    }
}

public class Main {
    public static void main(String[] args) {
        Account a = new Account("122365478", 1000);

        a.deposit(100.50);
        a.withdraw(200.80);
        a.withdraw(900);

        System.out.println(a.getBalance());
    }
}