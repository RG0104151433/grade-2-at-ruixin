// 来源：LeetCode-Solution《长按键入》
// https://leetcode.cn/problems/long-pressed-name/solutions/chang-an-jian-ru-by-leetcode-solution/
// 小节：方法一：双指针
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    bool isLongPressedName(string name, string typed) {
        int i = 0, j = 0;
        while (j < typed.length()) {
            if (i < name.length() && name[i] == typed[j]) {
                i++;
                j++;
            } else if (j > 0 && typed[j] == typed[j - 1]) {
                j++;
            } else {
                return false;
            }
        }
        return i == name.length();
    }
};
