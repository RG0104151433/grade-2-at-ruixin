//给你一个字符串 s 。请返回 s 中最长的 超赞子字符串 的长度。「超赞子字符串」需满足满足下述两个条件：该字符串是 s 的一个非空子字符串 进行任意次数的字符交换后，该字符串可以变成一个回文字符串
int longestAwesome(char* s) {
    int len = strlen(s), result = 0;
    int cnt[len + 1][10], cal[len + 1], fin[1024];
    // 初始化 fin 数组为 -1，表示状态从未出现过
    for (int i = 0; i < 1024; i++) fin[i] = -1;
    fin[0] = 0;   // 空前缀状态为 0，位置为 0
    // 初始化 cnt[0] 和 cal[0]
    for (int j = 0; j < 10; j++) cnt[0][j] = 0;
    cal[0] = 0;
    // 计算每个位置的前缀奇偶状态
    for (int i = 1; i <= len; i++) {
        // 继承上一个位置的状态
        for (int j = 0; j < 10; j++) cnt[i][j] = cnt[i - 1][j];
        // 翻转当前数字对应的奇偶位
        cnt[i][s[i - 1] - '0'] ^= 1;
        // 将奇偶状态编码为二进制整数
        cal[i] = 0;
        for (int j = 0; j < 10; j++)
            cal[i] += cnt[i][j] * (1 << j);   // 使用位移替代 pow
        // 检查全偶状态（允许 0 个奇数位）
        if (fin[cal[i]] != -1) {
            int len_sub = i - fin[cal[i]];
            if (len_sub > result) result = len_sub;
        }
        // 检查允许 1 个奇数位的情况（翻转某一位）
        for (int j = 0; j < 10; j++) {
            int target = cal[i] ^ (1 << j);
            if (fin[target] != -1) {
                int len_sub = i - fin[target];
                if (len_sub > result) result = len_sub;
            }
        }
        // 如果是首次遇到该状态，记录位置
        if (fin[cal[i]] == -1) fin[cal[i]] = i;
    }
    return result;
}
/**思路：首先用cnt数组记录截止到某一位置，0~9各个数字的出现次数，并对2取模，因为如果能够被2整除即可对称
 * 而后将每个位置的出现次数视为二进制数，将对应的十进制数转化入cal数组
 * 最后在fin数组中记录每个十进制数出现的第一个位置
 * 对于fin数组，我们反转某一位，得到所有的可能与该处恰好只多一个数字的情况并进行检查，根据情况更新
 */
