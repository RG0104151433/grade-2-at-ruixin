//给你一个数组 target 和一个整数 n。给你一个空栈和两种操作：
//"Push"：将一个整数加到栈顶。"Pop"：从栈顶删除一个整数。同时给定一个范围 [1, n] 中的整数流。
//使用两个栈操作使栈中的数字（从底部到顶部）等于 target。你应该遵循以下规则：
//如果整数流不为空，从流中选取下一个整数并将其推送到栈顶。如果栈不为空，弹出栈顶的整数。如果，在任何时刻，栈中的元素（从底部到顶部）等于 target，则不要从流中读取新的整数，也不要对栈进行更多操作。
//请返回遵循上述规则构建 target 所用的操作序列。如果存在多个合法答案，返回 任一 即可。
/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
char** buildArray(int* target, int targetSize, int n, int* returnSize) {
    int cnt=0,size=target[targetSize-1]>n?target[targetSize-1]:n,pos=0;
    char** result=(char**)calloc(size*2,sizeof(char*));//注意此处char需要加上*
    for (int i=0;i<size*2;i++) result[i]=(char*)calloc(5,sizeof(char));//注意还有\0，需要多一位
    for (int i=0;i<n && cnt<targetSize;i++) {//注意是从0还是1开始循环
        if (i+1==target[cnt]) {
            strcpy(result[pos],"Push");
            cnt++;
            pos++;
        }
        else {
            strcpy(result[pos],"Push");
            strcpy(result[pos+1],"Pop");
            pos+=2;
        }
    }
    *returnSize=pos;
    return result;
}
//一个数字要被跳过，需要先入栈而后出栈
//返回数组的大小不超过2*size
//cnt用于：计数到了target数组的哪里
//pos用于：计数result数组中有多少位置了
