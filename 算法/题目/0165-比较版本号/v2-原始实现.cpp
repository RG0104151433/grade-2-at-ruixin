// 说明：本文件由 `v1-原始实现.cpp` 拆出（该文件里写了 2 份实现），这是第 2 份。

//优化代码：即是比较，不必全部存储
class Solution {
public:
    int compareVersion(string version1, string version2) {
        int i = 0, j = 0;
        int n1 = version1.size(), n2 = version2.size();
        while (i < n1 || j < n2) {
            int num1 = 0;
            while (i < n1 && version1[i] != '.') {
                num1 = num1 * 10 + (version1[i++] - '0');
            }
            i++; // 跳过 '.' 或 i == n1 时自增不会越界（while 已保证）
            int num2 = 0;
            while (j < n2 && version2[j] != '.') {
                num2 = num2 * 10 + (version2[j++] - '0');
            }
            j++;
            if (num1 > num2) return 1;
            if (num1 < num2) return -1;
        }
        return 0; // 所有修订号相等
    }
};
