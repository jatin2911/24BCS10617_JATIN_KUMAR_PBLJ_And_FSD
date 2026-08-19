abstract class Bank {
    private int money;

    Bank(int money) {
        this.money = money;
    }

    public int getBalance() {
        return money;
    }

    public void setBalance(int value) {
        money = value;
    }
}

class Sbi extends Bank {

    Sbi(int money) {
        super(money);
    }

    public void deposit(int amount) {
        setBalance(getBalance() + amount);
    }

    public void withdraw(int amount) {
        setBalance(getBalance() - amount);
    }
}

public class Main {
    public static void main(String[] args) {
        Sbi acc = new Sbi(1000);

        acc.deposit(500);
        acc.withdraw(200);

        System.out.println(acc.getBalance());
    }
}