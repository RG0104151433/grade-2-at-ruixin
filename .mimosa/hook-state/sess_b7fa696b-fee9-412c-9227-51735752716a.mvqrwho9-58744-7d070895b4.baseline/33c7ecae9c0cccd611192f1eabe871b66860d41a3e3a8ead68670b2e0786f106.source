bool isLongPressedName(char* name, char* typed) {
    int i = 0, j = 0;
    int lenn = strlen(name), lent = strlen(typed);
    while (i < lenn && j < lent) {// 如果当前字符匹配，两个指针都前进
        if (name[i] == typed[j]) {
            i++;
            j++;
        } // 如果typed当前字符与前一个相同（长按情况），只移动typed指针
        else if (j > 0 && typed[j] == typed[j-1]) {
            j++;
        }// 否则不匹配
        else {
            return false;
        }
    }// 处理typed末尾的长按字符
    while (j < lent && typed[j] == typed[j-1]) {
        j++;
    }// 只有当name和typed都遍历完才算成功
    return i == lenn && j == lent;
}
