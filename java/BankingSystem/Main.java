import java.io.Closeable;

// --- STEP 1: Create Custom Exceptions ---

// TODO: Define InsufficientFundsException (Checked Exception)
// It should accept a message in its constructor.
class InsufficientFundsException extends Exception{
    public InsufficientFundsException(String str){
        super(str);
    }
}

// TODO: Define InvalidAmountException (Unchecked Exception)
// It should accept a message in its constructor.
class InvalidAmountException extends Exception{
    public InvalidAmountException(String str){
        super(str);
    }
}


// --- DUMMY RESOURCE FOR TRY-WITH-RESOURCES ---
class AuditLogger implements Closeable {
    public AuditLogger() {
        System.out.println("[LOG] Opening Audit Logger...");
    }

    public void logTransaction(String details) {
        System.out.println("[LOG] " + details);
    }

    @Override
    public void close() {
        System.out.println("[LOG] Closing Audit Logger resource.");
    }
}

// --- STEP 2: Implement BankAccount ---
class BankAccount {
    private String accountNumber;
    private double balance;

    public BankAccount(String accountNumber, double initialBalance) {
        this.accountNumber = accountNumber;
        this.balance = initialBalance;
    }

    public double getBalance() {
        return balance;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void deposit(double amount) throws InvalidAmountException {
        if (amount <= 0) {
            // TODO: Throw InvalidAmountException with message "Deposit amount must be positive"
            throw new InvalidAmountException("Deposit amount must be positive");
        }
        balance += amount;
    }

    public void withdraw(double amount) throws InsufficientFundsException,InvalidAmountException {
        if (amount <= 0) {
            // TODO: Throw InvalidAmountException with message "Withdrawal amount must be positive"
            throw new InvalidAmountException("Withdrawal amount must be positive");
        }
        if (amount > balance) {
            // TODO: Throw InsufficientFundsException with message detailing the deficit
            throw new InsufficientFundsException("You Don't have efficient balance");
        }
        balance -= amount;
    }

    public void transfer(BankAccount targetAccount, double amount) throws InsufficientFundsException {
        // TODO: Use try-with-resources with AuditLogger to auto-close the resource.
        // Inside the block:
        // 1. Log the attempt
        // 2. Perform the withdrawal from 'this' account
        // 3. Perform deposit to 'targetAccount'
        // 4. Log the success
        AuditLogger logger=new AuditLogger();
        try (logger) {
            logger.logTransaction(this.accountNumber+" is sending "+amount+" to "+targetAccount); 
            this.withdraw(amount);
            targetAccount.deposit(amount);           
        } catch (Exception e) {
            // TODO: handle exception
            System.out.println(e.getMessage());
        }

    }
}

// --- STEP 3: Test Driver ---
public class Main {
    public static void main(String[] args) {
        BankAccount acc1 = new BankAccount("ACC-101", 500.0);
        BankAccount acc2 = new BankAccount("ACC-202", 200.0);

        System.out.println("=== TEST 1: Successful Transfer ===");
        try {
            acc1.transfer(acc2, 150.0);
            System.out.println("Acc1 Balance: $" + acc1.getBalance());
            System.out.println("Acc2 Balance: $" + acc2.getBalance());
        } catch (InsufficientFundsException e) {
            System.out.println("Caught Expected Error: " + e.getMessage());
        }

        System.out.println("\n=== TEST 2: Overdraft (Checked Exception) ===");
        try {
            acc1.transfer(acc2, 1000.0); // Should fail
        } catch (InsufficientFundsException e) {
            System.out.println("Caught Checked Exception: " + e.getMessage());
        }

        System.out.println("\n=== TEST 3: Negative Amount (Unchecked Exception) ===");
        try {
            acc1.deposit(-50.0); // Should fail
        } catch (InvalidAmountException e) {
            System.out.println("Caught Unchecked Exception: " + e.getMessage());
        } finally {
            System.out.println("Cleanup / Always-executed code in main.");
        }
    }
}