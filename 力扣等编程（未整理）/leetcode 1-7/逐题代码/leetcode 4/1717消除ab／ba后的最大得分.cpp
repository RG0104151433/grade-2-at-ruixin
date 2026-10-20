//给你一个字符串 s 和两个整数 x 和 y 。你可以执行下面两种操作任意次。
//删除子字符串 "ab" 并得到 x 分。比方说，从 "cabxbae" 删除 ab ，得到 "cxbae" 。
//删除子字符串"ba" 并得到 y 分。比方说，从 "cabxbae" 删除 ba ，得到 "cabxe" 。
//请返回对 s 字符串执行上面操作若干次能得到的最大得分。
class Solution {
public:
    int maximumGain(string s, int x, int y) {
        string stk;   // 用 string 模拟栈
        string temp;
        int ans = 0;
        if (x >= y) {
            for (char c : s) {
                if (!stk.empty() && c == 'b' && stk.back() == 'a') {
                    stk.pop_back();
                    ans += x;
                } else {
                    stk.push_back(c);
                }
            }
            for (char c : stk) {   // 剩余字符顺序不变，可正常遍历
                if (!temp.empty() && c == 'a' && temp.back() == 'b') {
                    temp.pop_back();
                    ans += y;
                } else {
                    temp.push_back(c);
                }
            }
        } else {
            for (char c : s) {
                if (!stk.empty() && c == 'a' && stk.back() == 'b') {
                    stk.pop_back();
                    ans += y;
                } else {
                    stk.push_back(c);
                }
            }
            for (char c : stk) {
                if (!temp.empty() && c == 'b' && temp.back() == 'a') {
                    temp.pop_back();
                    ans += x;
                } else {
                    temp.push_back(c);
                }
            }
        }
        return ans;
    }
};
class Solution {
public:
    int maximumGain(string s, int x, int y) {
        char a = 'a', b = 'b';
        if (x < y) {
            swap(x, y);
            swap(a, b);
        }

        int ans = 0, cnt1 = 0, cnt2 = 0;
        for (char c : s) {
            if (c == a) {
                cnt1++;
            } else if (c == b) {
                if (cnt1) {
                    ans += x;
                    cnt1--;
                } else {
                    cnt2++;
                }
            } else {
                ans += min(cnt1, cnt2) * y;
                cnt1 = 0;
                cnt2 = 0;
            }
        }
        ans += min(cnt1, cnt2) * y;
        return ans;
    }
};
