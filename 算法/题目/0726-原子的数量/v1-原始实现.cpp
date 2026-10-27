class Solution {
public:
    string countOfAtoms(string formula) {
        // 用 vector<pair<string,int>> 模拟栈
        // string 存原子名（左括号哨兵也存在这里），int 存数量
        vector<pair<string, int>> stk;//通过vector pair建立元素与数量的关系
        int i = 0;
        int n = formula.size();
        while (i < n) {
            // ────────────────────────────────────────
            // 情况①：大写字母 → 解析原子名 + 后面的数字
            // ────────────────────────────────────────
            if (isupper(formula[i])) {
                string name = "";
                // 先读首字母（一定是大写）
                name += formula[i++];
                // 再读后续小写字母（原子名可能多个字母，如 "Mg"）
                while (i < n && islower(formula[i])) name += formula[i++];
                // 读后面的数字（注意：可能是多位数，如 "Fe12"）
                // 【易错】只读一位会导致 "H12" 解析成 1 而不是 12
                int num = 0;
                while (i < n && isdigit(formula[i]))num = num * 10 + (formula[i++] - '0');
                // 没有数字时默认为 1
                if (num == 0) num = 1;
                stk.push_back({name, num});
            // ────────────────────────────────────────
            // 情况②：左括号 → 压入哨兵，数量填 0 占位
            // ────────────────────────────────────────
            }
            else if (formula[i] == '(') {
                stk.push_back({"(", 0});
                i++;
            }
            // ────────────────────────────────────────
            // 情况③：右括号 → 读倍数，弹栈到哨兵，全部乘倍数后压回
            // ────────────────────────────────────────
            else {  // formula[i] == ')'
                i++;  // 跳过 ')'
                // 读括号后面的倍数（同样注意多位数）
                int num = 0;
                while (i < n && isdigit(formula[i]))num = num * 10 + (formula[i++] - '0');
                // 【易错】括号后没有数字时默认倍数为 1，不能留 0
                if (num == 0) num = 1;
                // 把括号内的元素全部弹出，暂存到 temp
                // 【易错】弹栈顺序是反的，但因为后面只做乘法，顺序不影响结果
                vector<pair<string, int>> temp;
                while (stk.back().first != "(") {
                    temp.push_back(stk.back());
                    stk.pop_back();
                }
                // 弹出哨兵 "("
                stk.pop_back();
                // 乘以倍数后重新压回主栈
                for (auto& p : temp)stk.push_back({p.first, p.second * num});
            }
        }
        // ────────────────────────────────────────────────────────
        // 后处理：用 map 合并同名原子并自动完成字典序排序
        // 【注意】map<string,int> 的 key 是按字典序自动排列的
        //         省去了手写 qsort / std::sort 的麻烦
        // ────────────────────────────────────────────────────────
        map<string, int> cnt;
        for (auto& p : stk)cnt[p.first] += p.second;
        // 拼接最终答案
        string ans = "";
        for (auto& p : cnt) {
            ans += p.first;
            // 数量为 1 时不输出数字
            if (p.second > 1)ans += to_string(p.second);
        }
        return ans;
    }
};
