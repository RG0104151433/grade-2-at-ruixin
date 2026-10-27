int strStr(char* haystack, char* needle) {
    int h_len = strlen(haystack);
    int n_len = strlen(needle);
    if (n_len == 0) {
        return 0;
    }
    if (h_len < n_len) {
        return -1;
    }
    for (int i = 0; i <= h_len - n_len; i++) {
        if (strncmp(haystack + i, needle, n_len) == 0) {//注意str处理方法
            return i;//不引入变量一直使用strlen会导致重复计算时间太长
        }
    }
    return -1;
}
