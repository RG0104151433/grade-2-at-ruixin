//给定 pushed 和 popped 两个序列，每个序列中的 值都不重复，只有当它们可能是在最初空栈上进行的推入 push 和弹出 pop 操作序列的结果时，返回 true；否则，返回 false 。
bool validateStackSequences(int* pushed, int pushedSize, int* popped, int poppedSize) {
    int push=-1,pop=0;
    for (int i=0;i<pushedSize;i++) {
        pushed[++push]=pushed[i];
        while (push>=0 && pushed[push]==popped[pop]) {//这里不要用if，用while
            push--;
            pop++;
        }
    }
    return push==-1;
}
