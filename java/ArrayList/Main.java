import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        List<List<Integer>> matrix = new ArrayList<>();
        LinkedList<Integer> result = new LinkedList<>();

        for (int i = 0; i < 3; i++) {
            ArrayList<Integer> temp = new ArrayList<>();

            for (int j = 0; j < 3; j++) {
                temp.add(sc.nextInt());
            }

            matrix.add(temp);
        }

        for (int i = 0; i < matrix.size(); i++) {
            for (int j = 0; j < matrix.get(i).size(); j++) {
                int x = matrix.get(i).get(j);

                if (x < 5) {
                    result.add(x * 2);
                }
            }
        }

        System.out.println(matrix);
        System.out.println(result);
    }
}